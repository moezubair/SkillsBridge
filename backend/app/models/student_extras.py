"""IELTS + skills extras for school matching (per uploaded file)."""

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class IeltsScores(BaseModel):
    overall: float | None = None
    listening: float | None = None
    reading: float | None = None
    writing: float | None = None
    speaking: float | None = None


class StudentExtrasBody(BaseModel):
    ielts: IeltsScores | None = None
    skills: list[str] = Field(default_factory=list)


class StudentExtrasRecord(BaseModel):
    id: UUID
    school_file_id: UUID
    ielts: dict[str, Any] | None = None
    skills: list[str] = Field(default_factory=list)
    updated_at: datetime
