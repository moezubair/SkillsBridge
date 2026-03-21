"""API / persistence models for transcript (scoreboard) extraction."""

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class TranscriptExtractionRecord(BaseModel):
    id: UUID
    file_id: UUID
    schema_version: str
    status: str = Field(..., description="complete | partial | failed")
    extraction: dict[str, Any]
    created_at: datetime


class TranscriptExtractionDetail(TranscriptExtractionRecord):
    extraction_metadata: dict[str, Any] | None = None
    parse_metadata: dict[str, Any] | None = None
    extract_metadata: dict[str, Any] | None = None
