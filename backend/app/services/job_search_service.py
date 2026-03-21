"""Orchestrate TinyFish run, normalization, heuristic match, and persistence."""

from __future__ import annotations

from uuid import UUID

from app.config.settings import Settings, TINYFISH_JOB_SEARCH_URL_DEFAULT
from app.core.debug_session_log import debug_ndjson
from app.core.exceptions import BadGatewayException, NotFoundException
from app.core.jobs.match_heuristic import build_goal_from_context, compute_match
from app.core.jobs.normalize import normalize_one_job
from app.core.tinyfish.client import TinyFishError, run_with_settings
from app.models.job import JobSearchResponse
from app.repositories.cv_extraction_repository import CvExtractionRepository
from app.repositories.job_file_repository import JobFileRepository
from app.repositories.job_discovery_repository import JobDiscoveryRepository
from app.repositories.job_preferences_repository import JobPreferencesRepository


class JobSearchService:
    def __init__(
        self,
        settings: Settings,
        files: JobFileRepository,
        cv_repo: CvExtractionRepository,
        prefs_repo: JobPreferencesRepository,
        discovery: JobDiscoveryRepository,
    ) -> None:
        self._settings = settings
        self._files = files
        self._cv_repo = cv_repo
        self._prefs_repo = prefs_repo
        self._discovery = discovery

    async def run_search(self, file_id: UUID) -> JobSearchResponse:
        meta = await self._files.get_by_id(file_id)
        if not meta:
            raise NotFoundException(message="File not found")

        prefs_row = await self._prefs_repo.get_by_file_id(file_id)
        prefs: dict = dict(prefs_row.preferences) if prefs_row else {}

        cv = await self._cv_repo.get_latest_for_file(file_id)
        extraction: dict = cv.extraction if cv and isinstance(cv.extraction, dict) else {}

        # Hardcoded MVP default (CareerBuilder); env may override to another allowlisted URL.
        search_url = (self._settings.TINYFISH_JOB_SEARCH_URL or "").strip() or TINYFISH_JOB_SEARCH_URL_DEFAULT

        run = await self._discovery.create_run(
            file_id=file_id,
            status="running",
            preferences_snapshot=prefs or None,
        )
        run_id = run.id

        try:
            goal = build_goal_from_context(preferences=prefs, extraction=extraction)
            # #region agent log
            debug_ndjson(
                hypothesis_id="H1-H3",
                location="job_search_service.py:run_search:pre_tinyfish",
                message="about to call TinyFish",
                data={
                    "job_file_id": str(file_id),
                    "search_url": search_url[:120],
                    "goal_len": len(goal),
                    "api_key_configured": bool(
                        (self._settings.TINYFISH_API_KEY or "").strip()
                    ),
                    "has_cv_extraction": bool(extraction),
                },
            )
            # #endregion
            result, tf_run_id = await run_with_settings(
                url=search_url,
                goal=goal,
                settings=self._settings,
            )
            if tf_run_id:
                await self._discovery.set_tinyfish_run_id(run_id, tf_run_id)

            normalized = normalize_one_job(result)
            if not normalized:
                await self._discovery.finalize_run(
                    run_id,
                    status="failed",
                    error_message="Agent result had no parseable job (title + url)",
                )
                raise BadGatewayException(
                    message="Could not parse a job from the agent response",
                )

            score, reasons = compute_match(
                job_title=normalized["title"],
                job_location=normalized.get("location"),
                job_snippet=normalized.get("description_snippet"),
                preferences=prefs,
                extraction=extraction,
            )

            listing = await self._discovery.insert_listing(
                search_run_id=run_id,
                source_site=normalized["source_site"],
                source_url=normalized["source_url"],
                title=normalized["title"],
                company=normalized.get("company"),
                location=normalized.get("location"),
                employment_type=normalized.get("employment_type"),
                remote_policy=normalized.get("remote_policy"),
                posted_at=normalized.get("posted_at"),
                description_snippet=normalized.get("description_snippet"),
                full_description=normalized.get("full_description"),
                salary_text=normalized.get("salary_text"),
                raw_agent_payload=normalized.get("raw_agent_payload"),
                match_score=score,
                match_reasons=reasons,
            )

            await self._discovery.finalize_run(
                run_id,
                status="complete",
                tinyfish_run_id=tf_run_id,
            )
        except TinyFishError as exc:
            # #region agent log
            debug_ndjson(
                hypothesis_id="H1-H5",
                location="job_search_service.py:run_search:tinyfish_error",
                message="TinyFishError caught",
                data={"exc_message": str(exc)[:500]},
            )
            # #endregion
            await self._discovery.finalize_run(
                run_id,
                status="failed",
                error_message=str(exc)[:2000],
            )
            detail = str(exc)[:400]
            raise BadGatewayException(
                message=f"TinyFish automation failed: {detail}",
            ) from exc

        run_out = await self._discovery.get_run(run_id)
        if not run_out:
            raise BadGatewayException(message="Run record missing after search")
        return JobSearchResponse(job=listing, run=run_out)
