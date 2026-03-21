"""Pydantic models for job preferences, search runs, and listings."""

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class JobPreferencesBody(BaseModel):
    """Wizard-style preferences persisted per CV file."""

    desired_titles: list[str] = Field(default_factory=list)
    locations: list[str] = Field(default_factory=list)
    remote_only: bool = False
    visa_sponsorship: bool = False
    industries: list[str] = Field(default_factory=list)
    seniority: str | None = None
    keywords_include: list[str] = Field(default_factory=list)
    keywords_exclude: list[str] = Field(default_factory=list)


class JobPreferencesRecord(BaseModel):
    id: UUID
    job_file_id: UUID
    preferences: dict[str, Any]
    updated_at: datetime


class JobListingOut(BaseModel):
    id: UUID
    search_run_id: UUID
    source_site: str
    source_url: str
    title: str
    company: str | None = None
    location: str | None = None
    employment_type: str | None = None
    remote_policy: str | None = None
    posted_at: datetime | None = None
    description_snippet: str | None = None
    salary_text: str | None = None
    match_score: int | None = None
    match_reasons: list[str] | None = None
    gap_analysis: dict[str, Any] | None = None
    learning_plan: dict[str, Any] | None = None
    fetched_at: datetime


class JobSearchRunOut(BaseModel):
    id: UUID
    job_file_id: UUID
    status: str
    started_at: datetime
    finished_at: datetime | None = None
    error_message: str | None = None
    tinyfish_run_id: str | None = None


class JobSearchResponse(BaseModel):
    job: JobListingOut
    run: JobSearchRunOut


class JobSearchRequest(BaseModel):
    """Run TinyFish once for this CV file (uses saved preferences + latest extraction)."""

    job_file_id: UUID
    target_role: str | None = Field(
        default=None,
        description="Primary role for this search run (free text); overrides emphasis vs saved desired_titles.",
    )
    include_learning_plan: bool = Field(
        default=True,
        description="If true and OPENAI_API_KEY is set, generate a JSON learning plan from gap analysis.",
    )


class LatestJobResponse(BaseModel):
    job: JobListingOut | None
    run: JobSearchRunOut | None
