"""DB DDL for upload metadata (run once at startup)."""

import asyncpg


async def ensure_uploaded_files_table(pool: asyncpg.Pool) -> None:
    """Create the files table if missing (simple bootstrap; replace with migrations later)."""
    async with pool.acquire() as conn:
        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS uploaded_files (
                id UUID PRIMARY KEY,
                original_filename TEXT NOT NULL,
                storage_key TEXT NOT NULL UNIQUE,
                mime_type TEXT NOT NULL,
                size_bytes BIGINT NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            """
        )
