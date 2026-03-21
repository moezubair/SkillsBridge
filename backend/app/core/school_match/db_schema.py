"""Postgres DDL for university matches and program assessments."""

import asyncpg


async def ensure_university_matches_table(pool: asyncpg.Pool) -> None:
    """Create university_matches table if missing."""
    async with pool.acquire() as conn:
        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS university_matches (
                id UUID PRIMARY KEY,
                school_file_id UUID NOT NULL REFERENCES school_uploaded_files(id) ON DELETE CASCADE,
                university TEXT NOT NULL,
                catalog_source TEXT NOT NULL,
                programs JSONB NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            """
        )
        await conn.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_university_matches_file_id
                ON university_matches (school_file_id, created_at DESC);
            """
        )


async def ensure_program_assessments_table(pool: asyncpg.Pool) -> None:
    """Create program_assessments table if missing."""
    async with pool.acquire() as conn:
        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS program_assessments (
                id UUID PRIMARY KEY,
                school_file_id UUID NOT NULL REFERENCES school_uploaded_files(id) ON DELETE CASCADE,
                program_id TEXT NOT NULL,
                overall_assessment TEXT NOT NULL,
                gaps JSONB NOT NULL,
                actions JSONB NOT NULL,
                alternate_paths JSONB NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            """
        )
        await conn.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_program_assessments_file_id
                ON program_assessments (school_file_id, created_at DESC);
            """
        )
        await conn.execute(
            """
            CREATE UNIQUE INDEX IF NOT EXISTS idx_program_assessments_unique
                ON program_assessments (school_file_id, program_id);
            """
        )