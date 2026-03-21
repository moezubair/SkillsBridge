"""Program requirement gathering: TinyFish web scraping + transcript lookup."""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Optional
from uuid import UUID

from app.config.settings import Settings
from app.core.exceptions import NotFoundException
from app.core.harvard.catalog import load_seed_majors
from app.core.harvard.match_goal import build_program_requirements_goal
from app.core.harvard.match_parse import parse_program_requirements
from app.core.tinyfish.client import TinyFishError, run_with_settings
from app.models.school_match import HarvardMatchResponse, UniversityProgramOut
from app.repositories.school_file_repository import SchoolFileRepository
from app.repositories.student_extras_repository import StudentExtrasRepository
from app.repositories.transcript_extraction_repository import TranscriptExtractionRepository

logger = logging.getLogger(__name__)

# Load universities config
_UNIVERSITIES_PATH = Path(__file__).resolve().parents[2] / "data" / "universities.json"


def _load_universities() -> list[dict]:
    """Load university configurations from universities.json."""
    if not _UNIVERSITIES_PATH.exists():
        logger.warning("universities.json not found, returning empty list")
        return []
    with open(_UNIVERSITIES_PATH) as f:
        return json.load(f)


class SchoolMatchService:
    def __init__(
        self,
        settings: Settings,
        files: SchoolFileRepository,
        transcripts: TranscriptExtractionRepository,
        extras: StudentExtrasRepository,
    ) -> None:
        self._settings = settings
        self._files = files
        self._transcripts = transcripts
        self._extras = extras

    async def match_harvard(
        self,
        school_file_id: Optional[UUID],
        *,
        ielts_id: Optional[UUID],
    ) -> HarvardMatchResponse:
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

        # Load Harvard config from universities.json
        universities = _load_universities()
        harvard_config = next((u for u in universities if u.get("name") == "Harvard"), None)
        if not harvard_config:
            logger.error("Harvard configuration not found in universities.json")
            return HarvardMatchResponse(
                school="Harvard",
                catalog_source="heuristic_fallback",
                programs=[],
            )

        catalog_url = harvard_config.get("catalog_url", "").strip()
        if not catalog_url:
            logger.warning("Harvard catalog_url not configured")
            return HarvardMatchResponse(
                school="Harvard",
                catalog_source="heuristic_fallback",
                programs=[],
            )

        goal = build_program_requirements_goal(
            extraction=extraction,
            ielts=ielts,
            skills=skills,
            program_names_for_context=names,
            university_name="Harvard",
        )

        key = (self._settings.TINYFISH_API_KEY or "").strip()
        if not key:
            logger.warning("TINYFISH_API_KEY not configured")
            return HarvardMatchResponse(
                school="Harvard",
                catalog_source="heuristic_fallback",
                programs=[],
            )

        timeout = float(
            self._settings.TINYFISH_HARVARD_TIMEOUT_SECONDS
            or self._settings.TINYFISH_SSE_TIMEOUT_SECONDS
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
                programs = [
                    UniversityProgramOut(**p) for p in parsed
                ]
                return HarvardMatchResponse(
                    school="Harvard",
                    catalog_source="tinyfish_gathered",
                    programs=programs,
                )
            logger.warning("Harvard TinyFish returned no parseable programs")
        except TinyFishError as exc:
            logger.warning("Harvard TinyFish run failed: %s", exc)

        return HarvardMatchResponse(
            school="Harvard",
            catalog_source="heuristic_fallback",
            programs=[],
        )
