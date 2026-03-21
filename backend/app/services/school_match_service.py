"""Harvard major matching: one TinyFish run with transcript-driven goal (mirrors job search pattern)."""

from __future__ import annotations

import logging
from typing import Optional
from uuid import UUID

from app.config.settings import Settings
from app.core.exceptions import NotFoundException
from app.core.harvard.catalog import load_seed_majors, merge_seed_and_agent
from app.core.harvard.match import match_student_to_majors
from app.core.harvard.match_goal import build_harvard_match_goal
from app.core.harvard.match_parse import enrich_detail_urls_from_seed, parse_harvard_ranked_matches
from app.core.tinyfish.client import TinyFishError, run_with_settings
from app.models.school_match import HarvardMatchResponse
from app.repositories.school_file_repository import SchoolFileRepository
from app.repositories.student_extras_repository import StudentExtrasRepository
from app.repositories.transcript_extraction_repository import TranscriptExtractionRepository

logger = logging.getLogger(__name__)


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
        majors_for_heuristic = merge_seed_and_agent(seed, [])
        names = [str(m["name"]) for m in seed if m.get("name")]

        goal = build_harvard_match_goal(
            extraction=extraction,
            ielts=ielts,
            skills=skills,
            major_names_for_context=names,
        )

        url = (self._settings.HARVARD_CATALOG_URL or "").strip()
        if not url:
            matches = match_student_to_majors(
                extraction=extraction,
                ielts=ielts,
                skills=skills,
                majors=majors_for_heuristic,
            )
            return HarvardMatchResponse(
                catalog_source="heuristic_no_catalog_url",
                matches=matches,
            )

        key = (self._settings.TINYFISH_API_KEY or "").strip()
        if not key:
            matches = match_student_to_majors(
                extraction=extraction,
                ielts=ielts,
                skills=skills,
                majors=majors_for_heuristic,
            )
            return HarvardMatchResponse(
                catalog_source="heuristic_no_tinyfish",
                matches=matches,
            )

        timeout = float(
            self._settings.TINYFISH_HARVARD_TIMEOUT_SECONDS
            or self._settings.TINYFISH_SSE_TIMEOUT_SECONDS
        )
        try:
            result, _tf = await run_with_settings(
                url=url,
                goal=goal,
                settings=self._settings,
                timeout_seconds=timeout,
            )
            parsed = parse_harvard_ranked_matches(result)
            enrich_detail_urls_from_seed(parsed, seed)
            if parsed:
                return HarvardMatchResponse(
                    catalog_source="tinyfish_ranked",
                    matches=parsed,
                )
            logger.warning("Harvard TinyFish returned no parseable matches; using heuristic fallback")
        except TinyFishError as exc:
            logger.warning("Harvard TinyFish match run failed: %s", exc)

        matches = match_student_to_majors(
            extraction=extraction,
            ielts=ielts,
            skills=skills,
            majors=majors_for_heuristic,
        )
        return HarvardMatchResponse(
            catalog_source="heuristic_fallback",
            matches=matches,
        )
