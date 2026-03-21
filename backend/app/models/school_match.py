"""API models for university program requirement gathering."""

from typing import Optional
from uuid import UUID
from datetime import datetime

from pydantic import BaseModel, Field, model_validator


class UniversityMatchRequest(BaseModel):
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
    refresh: bool = Field(
        default=False,
        description="If true, regenerate assessments even if they exist in DB.",
    )

    @model_validator(mode="after")
    def require_some_anchor(self) -> "UniversityMatchRequest":
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


class UniversityProgramMatch(BaseModel):
    university: str
    catalog_source: str = Field(
        ...,
        description="tinyfish_gathered | heuristic_fallback | tinyfish_failed",
    )
    programs: list[UniversityProgramOut]


class Gap(BaseModel):
    type: str
    requirement: str
    current: str
    severity: str


class Action(BaseModel):
    action: str
    why: str
    priority: int
    timeline: str
    estimated_impact: str
    difficulty: str


class ProgramAssessmentOut(BaseModel):
    program_id: str
    overall_assessment: str
    gaps: list[Gap]
    actions: list[Action]
    alternate_paths: list[str]


class UniversityMatchResponse(BaseModel):
    matches: list[UniversityProgramMatch]


class UniversityAssessmentResponse(BaseModel):
    assessments: list[ProgramAssessmentOut]


# DB Models
class UniversityMatchRecord(BaseModel):
    id: UUID
    school_file_id: UUID
    university: str
    catalog_source: str
    programs: list[dict]  # JSON serialized UniversityProgramOut
    created_at: datetime


class ProgramAssessmentRecord(BaseModel):
    id: UUID
    school_file_id: UUID
    program_id: str
    overall_assessment: str
    gaps: list[dict]
    actions: list[dict]
    alternate_paths: list[str]
    created_at: datetime

