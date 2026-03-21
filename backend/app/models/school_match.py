"""API models for university program requirement gathering."""

from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, model_validator


class HarvardMatchRequest(BaseModel):
    school_file_id: Optional[UUID] = Field(
        default=None,
        description="Transcript upload id. Optional if ielts_id is set (resolved from that row).",
    )
    ielts_id: Optional[UUID] = Field(
        default=None,
        description=(
            "Optional id of a student-extras row (PUT/GET /api/v1/student-extras). "
            "Loads IELTS + skills; implies school_file_id when omitted."
        ),
    )

    @model_validator(mode="after")
    def require_some_anchor(self) -> "HarvardMatchRequest":
        if self.school_file_id is None and self.ielts_id is None:
            raise ValueError("Provide school_file_id and/or ielts_id")
        return self


class UniversityProgramOut(BaseModel):
    name: str
    required_courses: list[str]
    required_gpa: Optional[str] = None
    required_tests: list[str]
    extracurriculars: list[str]
    other_requirements: list[str]
    detail_url: Optional[str] = None


class HarvardMatchResponse(BaseModel):
    school: str = "Harvard"
    catalog_source: str = Field(
        ...,
        description="tinyfish_gathered | heuristic_fallback | tinyfish_failed",
    )
    programs: list[UniversityProgramOut]

