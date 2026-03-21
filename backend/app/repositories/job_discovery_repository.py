"""Persistence for job_search_runs and job_listings."""

import json
from datetime import datetime
from typing import Any
from uuid import UUID, uuid4

import asyncpg

from app.config.settings import Settings
from app.core.postgres_client import PostgresClient
from app.models.job import JobListingOut, JobSearchRunOut
from app.repositories.base_repository import BaseRepository


class JobDiscoveryRepository(BaseRepository):
    async def create_run(
        self,
        *,
        file_id: UUID,
        status: str,
        preferences_snapshot: dict[str, Any] | None,
    ) -> JobSearchRunOut:
        run_id = uuid4()
        snap_json = (
            json.dumps(preferences_snapshot, ensure_ascii=False)
            if preferences_snapshot is not None
            else None
        )
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                INSERT INTO job_search_runs (
                    id, file_id, status, started_at, preferences_snapshot
                )
                VALUES ($1, $2, $3, NOW(), $4::jsonb)
                RETURNING id, file_id, status, started_at, finished_at,
                    error_message, tinyfish_run_id
                """,
                run_id,
                file_id,
                status,
                snap_json,
            )
        return _run_row_to_out(row)

    async def get_run(self, run_id: UUID) -> JobSearchRunOut | None:
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT id, file_id, status, started_at, finished_at,
                    error_message, tinyfish_run_id
                FROM job_search_runs
                WHERE id = $1
                """,
                run_id,
            )
        return _run_row_to_out(row) if row else None

    async def set_tinyfish_run_id(self, run_id: UUID, tinyfish_run_id: str) -> None:
        async with self.pool.acquire() as conn:
            await conn.execute(
                """
                UPDATE job_search_runs SET tinyfish_run_id = $2 WHERE id = $1
                """,
                run_id,
                tinyfish_run_id,
            )

    async def finalize_run(
        self,
        run_id: UUID,
        *,
        status: str,
        error_message: str | None = None,
        tinyfish_run_id: str | None = None,
    ) -> None:
        async with self.pool.acquire() as conn:
            await conn.execute(
                """
                UPDATE job_search_runs
                SET status = $2,
                    finished_at = NOW(),
                    error_message = $3,
                    tinyfish_run_id = COALESCE($4, tinyfish_run_id)
                WHERE id = $1
                """,
                run_id,
                status,
                error_message,
                tinyfish_run_id,
            )

    async def insert_listing(
        self,
        *,
        search_run_id: UUID,
        source_site: str,
        source_url: str,
        title: str,
        company: str | None,
        location: str | None,
        employment_type: str | None,
        remote_policy: str | None,
        posted_at: datetime | None,
        description_snippet: str | None,
        full_description: str | None,
        salary_text: str | None,
        raw_agent_payload: dict[str, Any] | None,
        match_score: int | None,
        match_reasons: list[str] | None,
        gap_analysis: dict[str, Any] | None = None,
        learning_plan: dict[str, Any] | None = None,
    ) -> JobListingOut:
        listing_id = uuid4()
        raw_json = (
            json.dumps(raw_agent_payload, ensure_ascii=False)
            if raw_agent_payload is not None
            else None
        )
        reasons_json = (
            json.dumps(match_reasons, ensure_ascii=False)
            if match_reasons is not None
            else None
        )
        gap_json = (
            json.dumps(gap_analysis, ensure_ascii=False) if gap_analysis is not None else None
        )
        plan_json = (
            json.dumps(learning_plan, ensure_ascii=False) if learning_plan is not None else None
        )
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                INSERT INTO job_listings (
                    id, search_run_id, source_site, source_url, title, company,
                    location, employment_type, remote_policy, posted_at,
                    description_snippet, full_description, salary_text,
                    raw_agent_payload, match_score, match_reasons,
                    gap_analysis, learning_plan
                )
                VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                    $11, $12, $13, $14::jsonb, $15, $16::jsonb,
                    $17::jsonb, $18::jsonb
                )
                RETURNING id, search_run_id, source_site, source_url, title, company,
                    location, employment_type, remote_policy, posted_at,
                    description_snippet, salary_text, match_score, match_reasons,
                    gap_analysis, learning_plan, fetched_at
                """,
                listing_id,
                search_run_id,
                source_site,
                source_url,
                title,
                company,
                location,
                employment_type,
                remote_policy,
                posted_at,
                description_snippet,
                full_description,
                salary_text,
                raw_json,
                match_score,
                reasons_json,
                gap_json,
                plan_json,
            )
        return _listing_row_to_out(row)

    async def get_latest_listing_for_file(self, file_id: UUID) -> tuple[JobListingOut, JobSearchRunOut] | None:
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT
                    l.id, l.search_run_id, l.source_site, l.source_url, l.title, l.company,
                    l.location, l.employment_type, l.remote_policy, l.posted_at,
                    l.description_snippet, l.salary_text, l.match_score, l.match_reasons,
                    l.gap_analysis, l.learning_plan, l.fetched_at,
                    r.id AS run_id, r.file_id, r.status, r.started_at, r.finished_at,
                    r.error_message, r.tinyfish_run_id
                FROM job_listings l
                INNER JOIN job_search_runs r ON r.id = l.search_run_id
                WHERE r.file_id = $1
                ORDER BY l.fetched_at DESC
                LIMIT 1
                """,
                file_id,
            )
        if not row:
            return None
        listing = JobListingOut(
            id=row["id"],
            search_run_id=row["search_run_id"],
            source_site=row["source_site"],
            source_url=row["source_url"],
            title=row["title"],
            company=row["company"],
            location=row["location"],
            employment_type=row["employment_type"],
            remote_policy=row["remote_policy"],
            posted_at=row["posted_at"],
            description_snippet=row["description_snippet"],
            salary_text=row["salary_text"],
            match_score=row["match_score"],
            match_reasons=_coerce_str_list(row["match_reasons"]),
            gap_analysis=_coerce_json_object(row["gap_analysis"]),
            learning_plan=_coerce_json_object(row["learning_plan"]),
            fetched_at=row["fetched_at"],
        )
        run = JobSearchRunOut(
            id=row["run_id"],
            job_file_id=row["file_id"],
            status=row["status"],
            started_at=row["started_at"],
            finished_at=row["finished_at"],
            error_message=row["error_message"],
            tinyfish_run_id=row["tinyfish_run_id"],
        )
        return listing, run


def _coerce_json_object(value: Any) -> dict[str, Any] | None:
    if value is None:
        return None
    if isinstance(value, dict):
        return value
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
        except json.JSONDecodeError:
            return None
        return parsed if isinstance(parsed, dict) else None
    return None


def _coerce_str_list(value: Any) -> list[str] | None:
    if value is None:
        return None
    if isinstance(value, list):
        return [str(x) for x in value]
    if isinstance(value, str):
        parsed = json.loads(value)
        if isinstance(parsed, list):
            return [str(x) for x in parsed]
    return None


def _run_row_to_out(row: asyncpg.Record) -> JobSearchRunOut:
    return JobSearchRunOut(
        id=row["id"],
        job_file_id=row["file_id"],
        status=row["status"],
        started_at=row["started_at"],
        finished_at=row["finished_at"],
        error_message=row["error_message"],
        tinyfish_run_id=row["tinyfish_run_id"],
    )


def _listing_row_to_out(row: asyncpg.Record) -> JobListingOut:
    return JobListingOut(
        id=row["id"],
        search_run_id=row["search_run_id"],
        source_site=row["source_site"],
        source_url=row["source_url"],
        title=row["title"],
        company=row["company"],
        location=row["location"],
        employment_type=row["employment_type"],
        remote_policy=row["remote_policy"],
        posted_at=row["posted_at"],
        description_snippet=row["description_snippet"],
        salary_text=row["salary_text"],
        match_score=row["match_score"],
        match_reasons=_coerce_str_list(row["match_reasons"]),
        gap_analysis=_coerce_json_object(row["gap_analysis"]),
        learning_plan=_coerce_json_object(row["learning_plan"]),
        fetched_at=row["fetched_at"],
    )
