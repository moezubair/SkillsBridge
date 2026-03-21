"""Resolve Harvard catalog (cache / TinyFish) and rank majors for a transcript file."""

from __future__ import annotations

from uuid import UUID

from app.config.settings import Settings
from app.core.exceptions import NotFoundException
from app.core.harvard.catalog import load_seed_majors, merge_seed_and_agent
from app.core.harvard.catalog_fetcher import fetch_harvard_catalog_via_tinyfish
from app.core.harvard.match import match_student_to_majors
from app.models.school_match import HarvardMatchResponse
from app.repositories.file_repository import FileRepository
from app.repositories.harvard_catalog_cache_repository import (
    HarvardCatalogCacheRepository,
    is_cache_fresh,
)
from app.repositories.student_extras_repository import StudentExtrasRepository
from app.repositories.transcript_extraction_repository import TranscriptExtractionRepository


class SchoolMatchService:
    def __init__(
        self,
        settings: Settings,
        files: FileRepository,
        transcripts: TranscriptExtractionRepository,
        extras: StudentExtrasRepository,
        harvard_cache: HarvardCatalogCacheRepository,
    ) -> None:
        self._settings = settings
        self._files = files
        self._transcripts = transcripts
        self._extras = extras
        self._harvard_cache = harvard_cache

    async def match_harvard(
        self,
        file_id: UUID,
        *,
        ielts_override: dict | None,
        skills_override: list[str] | None,
    ) -> HarvardMatchResponse:
        meta = await self._files.get_by_id(file_id)
        if not meta:
            raise NotFoundException(message="File not found")

        tr = await self._transcripts.get_latest_for_file(file_id)
        if not tr:
            raise NotFoundException(
                message="No transcript extraction for this file — run POST extract-transcript first",
            )

        extras_row = await self._extras.get_by_file_id(file_id)
        ielts: dict | None = dict(extras_row.ielts) if extras_row and extras_row.ielts else None
        skills: list[str] = list(extras_row.skills) if extras_row else []
        if ielts_override is not None:
            ielts = {**(ielts or {}), **ielts_override}
        if skills_override is not None:
            skills = list(skills_override)

        majors, catalog_source = await self._get_majors_catalog()

        matches = match_student_to_majors(
            extraction=tr.extraction,
            ielts=ielts,
            skills=skills,
            majors=majors,
        )
        return HarvardMatchResponse(
            catalog_source=catalog_source,
            matches=matches,
        )

    async def _get_majors_catalog(self) -> tuple[list[dict], str]:
        ttl = float(self._settings.HARVARD_CATALOG_CACHE_TTL_SECONDS)
        payload, fetched_at = await self._harvard_cache.get_entry()
        if (
            payload
            and is_cache_fresh(fetched_at, ttl)
            and isinstance(payload.get("majors"), list)
        ):
            meta = payload.get("meta")
            src = "cache"
            if isinstance(meta, dict) and meta.get("source"):
                src = f"cache:{meta['source']}"
            return payload["majors"], src

        data = await fetch_harvard_catalog_via_tinyfish(self._settings)
        majors = data.get("majors") or []
        if not isinstance(majors, list) or not majors:
            seed = load_seed_majors()
            majors = merge_seed_and_agent(seed, [])
            src = "seed_only"
        else:
            src = str(data.get("source") or "tinyfish+seed")

        await self._harvard_cache.upsert({"majors": majors, "meta": {"source": src}})
        return majors, src
