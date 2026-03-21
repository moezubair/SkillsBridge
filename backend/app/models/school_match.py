"""API models for Harvard (and future school) major matching."""

from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class HarvardMatchRequest(BaseModel):
    file_id: UUID
    ielts: dict[str, Any] | None = Field(
        default=None,
        description="Optional override; e.g. {overall: 7.0, reading: 7.5}",
    )
    skills: list[str] | None = Field(
        default=None,
        description="Optional override list; merges with saved student_extras if both exist",
    )


class HarvardMajorMatchOut(BaseModel):
    major: str
    score: int
    reasons: list[str]
    detail_url: str | None = None


class HarvardMatchResponse(BaseModel):
    school: str = "Harvard"
    catalog_source: str = Field(
        ...,
        description="cache | tinyfish+seed | seed_only",
    )
    matches: list[HarvardMajorMatchOut]
