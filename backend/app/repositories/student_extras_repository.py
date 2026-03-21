"""Persistence for student_extras (IELTS + skills per file_id)."""

import json
from typing import Any
from uuid import UUID, uuid4

import asyncpg

from app.config.settings import Settings
from app.core.postgres_client import PostgresClient
from app.models.student_extras import StudentExtrasRecord
from app.repositories.base_repository import BaseRepository


class StudentExtrasRepository(BaseRepository):
    async def upsert(
        self,
        *,
        file_id: UUID,
        ielts: dict[str, Any] | None,
        skills: list[str],
    ) -> StudentExtrasRecord:
        row_id = uuid4()
        ielts_json = json.dumps(ielts, ensure_ascii=False) if ielts is not None else None
        skills_json = json.dumps(skills, ensure_ascii=False)
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                INSERT INTO student_extras (id, file_id, ielts, skills, updated_at)
                VALUES ($1, $2, $3::jsonb, $4::jsonb, NOW())
                ON CONFLICT (file_id) DO UPDATE SET
                    ielts = EXCLUDED.ielts,
                    skills = EXCLUDED.skills,
                    updated_at = NOW()
                RETURNING id, file_id, ielts, skills, updated_at
                """,
                row_id,
                file_id,
                ielts_json,
                skills_json,
            )
        return _row_to_record(row)

    async def get_by_file_id(self, file_id: UUID) -> StudentExtrasRecord | None:
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT id, file_id, ielts, skills, updated_at
                FROM student_extras
                WHERE file_id = $1
                """,
                file_id,
            )
        return _row_to_record(row) if row else None

    async def get_by_id(self, extras_id: UUID) -> StudentExtrasRecord | None:
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT id, file_id, ielts, skills, updated_at
                FROM student_extras
                WHERE id = $1
                """,
                extras_id,
            )
        return _row_to_record(row) if row else None


def _coerce_json(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, (dict, list)):
        return value
    if isinstance(value, str):
        return json.loads(value)
    return value


def _row_to_record(row: asyncpg.Record) -> StudentExtrasRecord:
    ielts = _coerce_json(row["ielts"])
    skills_raw = _coerce_json(row["skills"])
    skills: list[str] = []
    if isinstance(skills_raw, list):
        skills = [str(x) for x in skills_raw]
    return StudentExtrasRecord(
        id=row["id"],
        school_file_id=row["file_id"],
        ielts=ielts if isinstance(ielts, dict) else None,
        skills=skills,
        updated_at=row["updated_at"],
    )
