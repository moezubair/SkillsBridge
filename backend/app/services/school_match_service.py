"""Program requirement gathering: TinyFish web scraping + transcript lookup."""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Optional
from uuid import UUID

import openai

from app.config.settings import Settings
from app.core.exceptions import NotFoundException
from app.core.harvard.catalog import load_seed_majors
from app.core.harvard.match_goal import build_program_requirements_goal
from app.core.harvard.match_parse import parse_program_requirements
from app.core.tinyfish.client import TinyFishError, run_with_settings
from app.models.school_match import (
    UniversityMatchRequest,
    UniversityMatchResponse,
    UniversityProgramOut,
    UniversityProgramMatch,
    ProgramAssessmentOut,
    Gap,
    Action,
    UniversityAssessmentResponse,
)
from app.repositories.school_file_repository import SchoolFileRepository
from app.repositories.school_match_repository import SchoolMatchRepository
from app.repositories.student_extras_repository import StudentExtrasRepository
from app.repositories.transcript_extraction_repository import TranscriptExtractionRepository

logger = logging.getLogger(__name__)

# Load universities config
_UNIVERSITIES_PATH = Path(__file__).resolve().parent.parent / "data" / "universities.json"


def _load_universities() -> list[dict]:
    """Load university configurations from universities.json."""
    if not _UNIVERSITIES_PATH.exists():
        logger.warning("universities.json not found, returning empty list")
        return []
    with open(_UNIVERSITIES_PATH) as f:
        return json.load(f)


def build_assessment_prompt(
    extraction: dict,
    ielts: Optional[dict],
    skills: list[str],
    program: UniversityProgramOut,
    university_name: str,
) -> str:
    """Build OpenAI prompt for program assessment."""
    prompt = f"""
You are an expert university admissions counselor. Analyze the student's profile against the requirements for the {program.name} program at {university_name}.

Student Profile:
- School: {extraction.get('school_name', 'Unknown')}
- Graduation Year: {extraction.get('graduation_year', 'Unknown')}
- GPA: {extraction.get('gpa', 'Unknown')} (scale: {extraction.get('gpa_scale', 'Unknown')})
- Courses: {', '.join([f"{c.get('name', '')} {c.get('grade', '')}" for c in extraction.get('courses', [])])}
"""
    if ielts:
        prompt += f"""
- IELTS: Overall {ielts.get('overall', 'Unknown')}, Listening {ielts.get('listening', 'Unknown')}, Reading {ielts.get('reading', 'Unknown')}, Writing {ielts.get('writing', 'Unknown')}, Speaking {ielts.get('speaking', 'Unknown')}
"""
    if skills:
        prompt += f"""
- Skills: {', '.join(skills)}
"""

    prompt += f"""

Program Requirements at {university_name}:
- Required Courses: {', '.join(program.required_courses)}
- Required GPA: {program.required_gpa or 'Not specified'}
- Required Tests: {', '.join(program.required_tests)}
- Extracurriculars: {', '.join(program.extracurriculars)}
- Other Requirements: {', '.join(program.other_requirements)}

Based on this, provide an assessment in the following JSON format. Be realistic and detailed.

{{
  "overall_assessment": "currently unlikely | borderline | reachable",
  "gaps": [
    {{
      "type": "grade_gap | course_gap | test_gap | extracurricular_gap | other_gap",
      "requirement": "description of requirement",
      "current": "what student has",
      "severity": "high | medium | low"
    }}
  ],
  "actions": [
    {{
      "action": "specific action to take",
      "why": "reason for this action",
      "priority": 1-10 (1 highest),
      "timeline": "immediate | next term | next year | etc.",
      "estimated_impact": "high | medium | low",
      "difficulty": "high | medium | low"
    }}
  ],
  "alternate_paths": [
    "string description of alternative"
  ]
}}

Output only the JSON, no other text.
"""
    return prompt.strip()


class SchoolMatchService:
    def __init__(
        self,
        settings: Settings,
        files: SchoolFileRepository,
        transcripts: TranscriptExtractionRepository,
        extras: StudentExtrasRepository,
        matches: SchoolMatchRepository,
    ) -> None:
        self._settings = settings
        self._files = files
        self._transcripts = transcripts
        self._extras = extras
        self._matches = matches

    async def match_universities(
        self,
        school_file_id: Optional[UUID],
        *,
        ielts_id: Optional[UUID],
    ) -> UniversityMatchResponse:
        ielts: Optional[dict] = None
        skills: list[str] = []
        resolved_file_id: Optional[UUID] = school_file_id

        if ielts_id is not None:
            row = await self._extras.get_by_id(ielts_id)
            if not row:
                raise NotFoundException(message="IELTS extras not found")
            if resolved_file_id is not None and row.school_file_id != resolved_file_id:
                raise NotFoundException(
                    message="ielts_id does not belong to this school_file_id",
                )
            resolved_file_id = row.school_file_id
            ielts = dict(row.ielts) if row.ielts else None
            skills = list(row.skills)

        if resolved_file_id is None:
            raise NotFoundException(message="Could not resolve school_file_id")

        meta = await self._files.get_by_id(resolved_file_id)
        if not meta:
            raise NotFoundException(message="File not found")

        tr = await self._transcripts.get_latest_for_file(resolved_file_id)
        if not tr:
            raise NotFoundException(
                message="No transcript extraction for this file — run POST extract-transcript first",
            )

        extraction = tr.extraction if isinstance(tr.extraction, dict) else {}
        seed = load_seed_majors()
        names = [str(m["name"]) for m in seed if m.get("name")]

        # Gather data for every university in config
        universities = _load_universities()
        matches: list[UniversityProgramMatch] = []

        if not universities:
            logger.warning("No universities configured in universities.json")
            return UniversityMatchResponse(matches=[])

        key = (self._settings.TINYFISH_API_KEY or "").strip()
        if not key:
            logger.warning("TINYFISH_API_KEY not configured")
            return UniversityMatchResponse(matches=[])

        timeout = float(
            self._settings.TINYFISH_HARVARD_TIMEOUT_SECONDS
            or self._settings.TINYFISH_SSE_TIMEOUT_SECONDS
        )

        for university_config in universities:
            university_name = str(university_config.get("name", "")).strip()
            if not university_name:
                logger.warning("Skipping university entry with missing name")
                continue

            catalog_url = str(university_config.get("catalog_url", "")).strip()
            if not catalog_url:
                logger.warning("%s catalog_url not configured, skipping", university_name)
                continue

            goal = build_program_requirements_goal(
                extraction=extraction,
                ielts=ielts,
                skills=skills,
                program_names_for_context=names,
                university_name=university_name,
            )

            try:
                result, _tf = await run_with_settings(
                    url=catalog_url,
                    goal=goal,
                    settings=self._settings,
                    timeout_seconds=timeout,
                )
                parsed = parse_program_requirements(result)
                if parsed:
                    programs = [UniversityProgramOut(**p) for p in parsed]
                    # Save the match
                    await self._matches.save_university_match(
                        school_file_id=resolved_file_id,
                        university=university_name,
                        catalog_source="tinyfish_gathered",
                        programs=[p.model_dump() for p in programs],
                    )
                    matches.append(
                        UniversityProgramMatch(
                            university=university_name,
                            catalog_source="tinyfish_gathered",
                            programs=programs,
                        )
                    )

                else:
                    logger.warning("%s TinyFish returned no parseable programs", university_name)
                    # Save empty match
                    await self._matches.save_university_match(
                        school_file_id=resolved_file_id,
                        university=university_name,
                        catalog_source="tinyfish_no_data",
                        programs=[],
                    )
            except TinyFishError as exc:
                logger.warning("%s TinyFish run failed: %s", university_name, exc)
                # Save failed match
                await self._matches.save_university_match(
                    school_file_id=resolved_file_id,
                    university=university_name,
                    catalog_source="tinyfish_failed",
                    programs=[],
                )

        return UniversityMatchResponse(matches=matches)

    async def assess_universities(
        self,
        school_file_id: Optional[UUID],
        *,
        ielts_id: Optional[UUID],
        refresh: bool = False,
    ) -> UniversityAssessmentResponse:
        from app.models.school_match import UniversityAssessmentResponse
        ielts: Optional[dict] = None
        skills: list[str] = []
        resolved_file_id: Optional[UUID] = school_file_id

        if ielts_id is not None:
            row = await self._extras.get_by_id(ielts_id)
            if not row:
                raise NotFoundException(message="IELTS extras not found")
            if resolved_file_id is not None and row.school_file_id != resolved_file_id:
                raise NotFoundException(
                    message="ielts_id does not belong to this school_file_id",
                )
            resolved_file_id = row.school_file_id
            ielts = dict(row.ielts) if row.ielts else None
            skills = list(row.skills)

        if resolved_file_id is None:
            raise NotFoundException(message="Could not resolve school_file_id")

        # Check if assessments already exist
        existing_assessments = await self._matches.get_program_assessments_for_file(resolved_file_id)
        if existing_assessments and not refresh:
            # Convert to response format
            assessments = []
            for rec in existing_assessments:
                gaps = [Gap(**g) for g in rec.gaps]
                actions = [Action(**a) for a in rec.actions]
                assessment = ProgramAssessmentOut(
                    program_id=rec.program_id,
                    overall_assessment=rec.overall_assessment,
                    gaps=gaps,
                    actions=actions,
                    alternate_paths=rec.alternate_paths,
                )
                assessments.append(assessment)
            return UniversityAssessmentResponse(assessments=assessments)

        # Get extraction and matches for fresh assessment
        tr = await self._transcripts.get_latest_for_file(resolved_file_id)
        if not tr:
            raise NotFoundException(
                message="No transcript extraction for this file — run POST extract-transcript first",
            )
        extraction = tr.extraction if isinstance(tr.extraction, dict) else {}

        # Get matches from DB
        matches = await self._matches.get_university_matches_for_file(resolved_file_id)
        if not matches:
            raise NotFoundException(message="No university matches found — run POST /api/v1/school-matches first")

        openai_key = (self._settings.OPENAI_API_KEY or "").strip()
        if not openai_key:
            logger.warning("OPENAI_API_KEY not configured")
            return UniversityAssessmentResponse(assessments=[])

        client = openai.AsyncOpenAI(api_key=openai_key)
        assessments: list[ProgramAssessmentOut] = []

        for match in matches:
            for program_dict in match.programs:
                program = UniversityProgramOut(**program_dict)
                program_id = f"{match.university} {program.name}"
                prompt = build_assessment_prompt(
                    extraction=extraction,
                    ielts=ielts,
                    skills=skills,
                    program=program,
                    university_name=match.university,
                )
                try:
                    response = await client.chat.completions.create(
                        model="gpt-4o-mini",
                        messages=[{"role": "user", "content": prompt}],
                        temperature=0.1,
                    )
                    content = response.choices[0].message.content.strip()
                    assessment_data = json.loads(content)
                    gaps = [Gap(**g) for g in assessment_data.get("gaps", [])]
                    actions = [Action(**a) for a in assessment_data.get("actions", [])]
                    alternate_paths = assessment_data.get("alternate_paths", [])
                    assessment = ProgramAssessmentOut(
                        program_id=program_id,
                        overall_assessment=assessment_data["overall_assessment"],
                        gaps=gaps,
                        actions=actions,
                        alternate_paths=alternate_paths,
                    )
                    assessments.append(assessment)
                    # Save assessment
                    await self._matches.save_program_assessment(
                        school_file_id=resolved_file_id,
                        program_id=program_id,
                        overall_assessment=assessment.overall_assessment,
                        gaps=[g.model_dump() for g in gaps],
                        actions=[a.model_dump() for a in actions],
                        alternate_paths=alternate_paths,
                    )
                except Exception as e:
                    logger.warning("Failed to assess %s: %s", program_id, e)
                    continue

        return UniversityAssessmentResponse(assessments=assessments)
