"""Persistence for job (career/CV) uploaded file metadata."""

from uuid import UUID

import asyncpg

from app.config.settings import Settings
from app.core.postgres_client import PostgresClient
from app.models.file import StoredFile, StoredFileCreate
from app.repositories.base_repository import BaseRepository


class JobFileRepository(BaseRepository):
    async def insert(self, data: StoredFileCreate) -> StoredFile:
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                INSERT INTO job_uploaded_files
                    (id, original_filename, storage_key, mime_type, size_bytes)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id, original_filename, storage_key, mime_type, size_bytes, created_at
                """,
                data.id,
                data.original_filename,
                data.storage_key,
                data.mime_type,
                data.size_bytes,
            )
        return _row_to_model(row)

    async def get_by_id(self, file_id: UUID) -> StoredFile | None:
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT id, original_filename, storage_key, mime_type, size_bytes, created_at
                FROM job_uploaded_files
                WHERE id = $1
                """,
                file_id,
            )
        return _row_to_model(row) if row else None


def _row_to_model(row: asyncpg.Record) -> StoredFile:
    return StoredFile(
        id=row["id"],
        original_filename=row["original_filename"],
        storage_key=row["storage_key"],
        mime_type=row["mime_type"],
        size_bytes=row["size_bytes"],
        created_at=row["created_at"],
    )
