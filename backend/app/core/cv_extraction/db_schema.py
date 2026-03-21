"""Postgres DDL for CV extraction rows linked to job_uploaded_files."""

import asyncpg


async def ensure_cv_extractions_table(pool: asyncpg.Pool) -> None:
    """Create cv_extractions if missing (FK to job_uploaded_files)."""
    async with pool.acquire() as conn:
        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS cv_extractions (
                id UUID PRIMARY KEY,
                file_id UUID NOT NULL REFERENCES job_uploaded_files(id) ON DELETE CASCADE,
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
            CREATE INDEX IF NOT EXISTS idx_cv_extractions_file_id
                ON cv_extractions (file_id, created_at DESC);
            """
        )
