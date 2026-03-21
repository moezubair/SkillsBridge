"""Single-row cache for merged Harvard major catalog (JSON payload)."""

import json
from datetime import datetime, timezone
from typing import Any

import asyncpg

from app.config.settings import Settings
from app.core.postgres_client import PostgresClient
from app.repositories.base_repository import BaseRepository

HARVARD_CACHE_KEY = "harvard_majors_v1"


class HarvardCatalogCacheRepository(BaseRepository):
    async def get_entry(self) -> tuple[dict[str, Any] | None, datetime | None]:
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT payload, fetched_at
                FROM harvard_catalog_cache
                WHERE cache_key = $1
                """,
                HARVARD_CACHE_KEY,
            )
        if not row:
            return None, None
        payload = row["payload"]
        if isinstance(payload, str):
            payload = json.loads(payload)
        if not isinstance(payload, dict):
            return None, None
        return payload, row["fetched_at"]

    async def upsert(self, payload: dict[str, Any]) -> None:
        body = json.dumps(payload, ensure_ascii=False)
        async with self.pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO harvard_catalog_cache (cache_key, payload, fetched_at)
                VALUES ($1, $2::jsonb, NOW())
                ON CONFLICT (cache_key) DO UPDATE SET
                    payload = EXCLUDED.payload,
                    fetched_at = NOW()
                """,
                HARVARD_CACHE_KEY,
                body,
            )


def is_cache_fresh(fetched_at: datetime | None, ttl_seconds: float) -> bool:
    if fetched_at is None:
        return False
    if fetched_at.tzinfo is None:
        fetched_at = fetched_at.replace(tzinfo=timezone.utc)
    age = (datetime.now(timezone.utc) - fetched_at).total_seconds()
    return age >= 0 and age < ttl_seconds
