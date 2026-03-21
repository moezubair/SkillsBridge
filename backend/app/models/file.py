"""Domain models for persisted file uploads (metadata in DB, bytes on disk)."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class StoredFile(BaseModel):
    """Record returned from the DB after a successful PDF upload."""

    id: UUID
    original_filename: str = Field(..., max_length=512)
    storage_key: str = Field(..., description="Relative path / filename under the upload root")
    mime_type: str
    size_bytes: int = Field(..., ge=0)
    created_at: datetime


class StoredFileCreate(BaseModel):
    """Values needed to insert a new row (id is generated before writing bytes)."""

    id: UUID
    original_filename: str
    storage_key: str
    mime_type: str
    size_bytes: int
