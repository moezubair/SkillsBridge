"""Postgres DDL for transcript extraction, student extras, and Harvard catalog cache."""

import asyncpg


async def ensure_school_tables(pool: asyncpg.Pool) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS transcript_extractions (
                id UUID PRIMARY KEY,
                file_id UUID NOT NULL REFERENCES school_uploaded_files(id) ON DELETE CASCADE,
                schema_version TEXT NOT NULL,
                status TEXT NOT NULL,
                extraction JSONB NOT NULL,
                extraction_metadata JSONB,
                parse_metadata JSONB NOT NULL,
                extract_metadata JSONB,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            """
        )
        await conn.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_transcript_extractions_file_id
                ON transcript_extractions (file_id, created_at DESC);
            """
        )
        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS student_extras (
                id UUID PRIMARY KEY,
                file_id UUID NOT NULL UNIQUE REFERENCES school_uploaded_files(id) ON DELETE CASCADE,
                ielts JSONB,
                skills JSONB,
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            """
        )
        await conn.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_student_extras_file_id
                ON student_extras (file_id);
            """
        )
        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS harvard_catalog_cache (
                cache_key TEXT PRIMARY KEY,
                payload JSONB NOT NULL,
                fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            """
        )
