"""Persistence for user_job_preferences (one row per uploaded CV file)."""

import json
from typing import Any
from uuid import UUID, uuid4

import asyncpg

from app.config.settings import Settings
from app.core.postgres_client import PostgresClient
from app.models.job import JobPreferencesRecord
from app.repositories.base_repository import BaseRepository


class JobPreferencesRepository(BaseRepository):
    async def upsert(
        self,
        *,
        file_id: UUID,
        preferences: dict[str, Any],
    ) -> JobPreferencesRecord:
        row_id = uuid4()
        prefs_json = json.dumps(preferences, ensure_ascii=False)
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                INSERT INTO user_job_preferences (id, file_id, preferences, updated_at)
                VALUES ($1, $2, $3::jsonb, NOW())
                ON CONFLICT (file_id) DO UPDATE SET
                    preferences = EXCLUDED.preferences,
                    updated_at = NOW()
                RETURNING id, file_id, preferences, updated_at
                """,
                row_id,
                file_id,
                prefs_json,
            )
        return _row_to_record(row)

    async def get_by_file_id(self, file_id: UUID) -> JobPreferencesRecord | None:
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT id, file_id, preferences, updated_at
                FROM user_job_preferences
                WHERE file_id = $1
                """,
                file_id,
            )
        return _row_to_record(row) if row else None


def _coerce_json(value: Any) -> dict[str, Any]:
    if value is None:
        return {}
    if isinstance(value, dict):
        return value
    if isinstance(value, str):
        return json.loads(value)
    return {}


def _row_to_record(row: asyncpg.Record) -> JobPreferencesRecord:
    return JobPreferencesRecord(
        id=row["id"],
        job_file_id=row["file_id"],
        preferences=_coerce_json(row["preferences"]),
        updated_at=row["updated_at"],
    )
