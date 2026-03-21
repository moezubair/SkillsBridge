"""DB DDL for upload metadata (run once at startup)."""

import asyncpg


async def ensure_uploaded_files_table(pool: asyncpg.Pool) -> None:
    """Legacy table kept for backfill when migrating existing deployments."""
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


async def ensure_job_uploaded_files_table(pool: asyncpg.Pool) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS job_uploaded_files (
                id UUID PRIMARY KEY,
                original_filename TEXT NOT NULL,
                storage_key TEXT NOT NULL UNIQUE,
                mime_type TEXT NOT NULL,
                size_bytes BIGINT NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            """
        )


async def ensure_school_uploaded_files_table(pool: asyncpg.Pool) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS school_uploaded_files (
                id UUID PRIMARY KEY,
                original_filename TEXT NOT NULL,
                storage_key TEXT NOT NULL UNIQUE,
                mime_type TEXT NOT NULL,
                size_bytes BIGINT NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            """
        )


async def ensure_scoped_upload_fk_migration(pool: asyncpg.Pool) -> None:
    """
    Backfill job_uploaded_files / school_uploaded_files from legacy uploaded_files,
    then repoint child-table FKs from uploaded_files to scoped tables.
    Idempotent: safe to run on every startup.
    """
    async with pool.acquire() as conn:
        async with conn.transaction():
            await conn.execute(
                """
                INSERT INTO job_uploaded_files
                    (id, original_filename, storage_key, mime_type, size_bytes, created_at)
                SELECT u.id, u.original_filename, u.storage_key, u.mime_type, u.size_bytes, u.created_at
                FROM uploaded_files u
                WHERE u.id IN (
                    SELECT file_id FROM cv_extractions
                    UNION
                    SELECT file_id FROM user_job_preferences
                    UNION
                    SELECT file_id FROM job_search_runs
                )
                ON CONFLICT (id) DO NOTHING;
                """
            )
            await conn.execute(
                """
                INSERT INTO school_uploaded_files
                    (id, original_filename, storage_key, mime_type, size_bytes, created_at)
                SELECT u.id, u.original_filename, u.storage_key, u.mime_type, u.size_bytes, u.created_at
                FROM uploaded_files u
                WHERE u.id IN (
                    SELECT file_id FROM transcript_extractions
                    UNION
                    SELECT file_id FROM student_extras
                )
                ON CONFLICT (id) DO NOTHING;
                """
            )
            await conn.execute(
                """
                ALTER TABLE cv_extractions
                    DROP CONSTRAINT IF EXISTS cv_extractions_file_id_fkey;
                ALTER TABLE cv_extractions
                    ADD CONSTRAINT cv_extractions_file_id_fkey
                    FOREIGN KEY (file_id) REFERENCES job_uploaded_files(id) ON DELETE CASCADE;
                """
            )
            await conn.execute(
                """
                ALTER TABLE user_job_preferences
                    DROP CONSTRAINT IF EXISTS user_job_preferences_file_id_fkey;
                ALTER TABLE user_job_preferences
                    ADD CONSTRAINT user_job_preferences_file_id_fkey
                    FOREIGN KEY (file_id) REFERENCES job_uploaded_files(id) ON DELETE CASCADE;
                """
            )
            await conn.execute(
                """
                ALTER TABLE job_search_runs
                    DROP CONSTRAINT IF EXISTS job_search_runs_file_id_fkey;
                ALTER TABLE job_search_runs
                    ADD CONSTRAINT job_search_runs_file_id_fkey
                    FOREIGN KEY (file_id) REFERENCES job_uploaded_files(id) ON DELETE CASCADE;
                """
            )
            await conn.execute(
                """
                ALTER TABLE transcript_extractions
                    DROP CONSTRAINT IF EXISTS transcript_extractions_file_id_fkey;
                ALTER TABLE transcript_extractions
                    ADD CONSTRAINT transcript_extractions_file_id_fkey
                    FOREIGN KEY (file_id) REFERENCES school_uploaded_files(id) ON DELETE CASCADE;
                """
            )
            await conn.execute(
                """
                ALTER TABLE student_extras
                    DROP CONSTRAINT IF EXISTS student_extras_file_id_fkey;
                ALTER TABLE student_extras
                    ADD CONSTRAINT student_extras_file_id_fkey
                    FOREIGN KEY (file_id) REFERENCES school_uploaded_files(id) ON DELETE CASCADE;
                """
            )
