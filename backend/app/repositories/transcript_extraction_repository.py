"""Persistence for transcript_extractions."""

import json
from typing import Any
from uuid import UUID, uuid4

import asyncpg

from app.config.settings import Settings
from app.core.postgres_client import PostgresClient
from app.models.transcript_extraction import TranscriptExtractionDetail, TranscriptExtractionRecord
from app.repositories.base_repository import BaseRepository


class TranscriptExtractionRepository(BaseRepository):
    async def insert(
        self,
        *,
        file_id: UUID,
        schema_version: str,
        status: str,
        extraction: dict[str, Any],
        extraction_metadata: dict[str, Any] | None,
        parse_metadata: dict[str, Any],
        extract_metadata: dict[str, Any] | None,
    ) -> TranscriptExtractionDetail:
        row_id = uuid4()
        ex_json = json.dumps(extraction, ensure_ascii=False)
        ex_meta_json = (
            json.dumps(extraction_metadata, ensure_ascii=False)
            if extraction_metadata is not None
            else None
        )
        parse_json = json.dumps(parse_metadata, ensure_ascii=False)
        ext_meta_json = (
            json.dumps(extract_metadata, ensure_ascii=False)
            if extract_metadata is not None
            else None
        )
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                INSERT INTO transcript_extractions (
                    id, file_id, schema_version, status,
                    extraction, extraction_metadata, parse_metadata, extract_metadata
                )
                VALUES (
                    $1, $2, $3, $4,
                    $5::jsonb, $6::jsonb, $7::jsonb, $8::jsonb
                )
                RETURNING id, file_id, schema_version, status, extraction,
                    extraction_metadata, parse_metadata, extract_metadata, created_at
                """,
                row_id,
                file_id,
                schema_version,
                status,
                ex_json,
                ex_meta_json,
                parse_json,
                ext_meta_json,
            )
        return _row_to_detail(row)

    async def get_latest_for_file(self, file_id: UUID) -> TranscriptExtractionDetail | None:
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT id, file_id, schema_version, status, extraction,
                    extraction_metadata, parse_metadata, extract_metadata, created_at
                FROM transcript_extractions
                WHERE file_id = $1
                ORDER BY created_at DESC
                LIMIT 1
                """,
                file_id,
            )
        return _row_to_detail(row) if row else None


def _coerce_json_object(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, dict):
        return value
    if isinstance(value, str):
        return json.loads(value)
    return value


def _row_to_detail(row: asyncpg.Record) -> TranscriptExtractionDetail:
    return TranscriptExtractionDetail(
        id=row["id"],
        file_id=row["file_id"],
        schema_version=row["schema_version"],
        status=row["status"],
        extraction=_coerce_json_object(row["extraction"]),
        extraction_metadata=_coerce_json_object(row["extraction_metadata"]),
        parse_metadata=_coerce_json_object(row["parse_metadata"]),
        extract_metadata=_coerce_json_object(row["extract_metadata"]),
        created_at=row["created_at"],
    )


def transcript_to_summary(detail: TranscriptExtractionDetail) -> TranscriptExtractionRecord:
    return TranscriptExtractionRecord(
        id=detail.id,
        file_id=detail.file_id,
        schema_version=detail.schema_version,
        status=detail.status,
        extraction=detail.extraction,
        created_at=detail.created_at,
    )
