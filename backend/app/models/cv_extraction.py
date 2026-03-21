"""API / persistence models for LandingAI CV extraction results."""

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class CvExtractionRecord(BaseModel):
    """One persisted extraction run for an uploaded file."""

    id: UUID
    file_id: UUID
    schema_version: str
    status: str = Field(..., description="complete | partial | failed")
    extraction: dict[str, Any]
    created_at: datetime


class CvExtractionDetail(CvExtractionRecord):
    """Includes optional metadata for debugging or UI grounding."""

    extraction_metadata: dict[str, Any] | None = None
    parse_metadata: dict[str, Any] | None = None
    extract_metadata: dict[str, Any] | None = None
