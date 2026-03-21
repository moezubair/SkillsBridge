"""Postgres DDL for job preferences, search runs, and listings."""

import asyncpg


async def ensure_job_tables(pool: asyncpg.Pool) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS user_job_preferences (
                id UUID PRIMARY KEY,
                file_id UUID NOT NULL UNIQUE REFERENCES uploaded_files(id) ON DELETE CASCADE,
                preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            """
        )
        await conn.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_user_job_preferences_file_id
                ON user_job_preferences (file_id);
            """
        )
        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS job_search_runs (
                id UUID PRIMARY KEY,
                file_id UUID NOT NULL REFERENCES uploaded_files(id) ON DELETE CASCADE,
                status TEXT NOT NULL,
                started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                finished_at TIMESTAMPTZ,
                error_message TEXT,
                preferences_snapshot JSONB,
                tinyfish_run_id TEXT
            );
            """
        )
        await conn.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_job_search_runs_file_started
                ON job_search_runs (file_id, started_at DESC);
            """
        )
        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS job_listings (
                id UUID PRIMARY KEY,
                search_run_id UUID NOT NULL REFERENCES job_search_runs(id) ON DELETE CASCADE,
                source_site TEXT NOT NULL DEFAULT '',
                source_url TEXT NOT NULL,
                title TEXT NOT NULL,
                company TEXT,
                location TEXT,
                employment_type TEXT,
                remote_policy TEXT,
                posted_at TIMESTAMPTZ,
                description_snippet TEXT,
                full_description TEXT,
                salary_text TEXT,
                raw_agent_payload JSONB,
                match_score INT,
                match_reasons JSONB,
                fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            """
        )
        await conn.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_job_listings_search_run
                ON job_listings (search_run_id);
            """
        )
