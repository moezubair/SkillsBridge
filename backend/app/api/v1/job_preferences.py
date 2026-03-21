"""CRUD for job preferences linked to a job (CV) upload (`job_file_id`)."""

from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.core.exceptions import NotFoundException
from app.dependencies import get_job_file_repository, get_job_preferences_repository
from app.models.job import JobPreferencesBody, JobPreferencesRecord
from app.repositories.job_file_repository import JobFileRepository
from app.repositories.job_preferences_repository import JobPreferencesRepository

router = APIRouter()


@router.put("", response_model=JobPreferencesRecord)
async def put_job_preferences(
    job_file_id: UUID = Query(..., description="Job upload id from POST /api/v1/job/files/upload"),
    body: JobPreferencesBody = ...,
    files: JobFileRepository = Depends(get_job_file_repository),
    prefs: JobPreferencesRepository = Depends(get_job_preferences_repository),
):
    meta = await files.get_by_id(job_file_id)
    if not meta:
        raise NotFoundException(message="File not found")
    payload = body.model_dump(exclude_none=True)
    return await prefs.upsert(file_id=job_file_id, preferences=payload)


@router.get("", response_model=JobPreferencesRecord)
async def get_job_preferences(
    job_file_id: UUID = Query(..., description="Job upload id"),
    prefs: JobPreferencesRepository = Depends(get_job_preferences_repository),
):
    row = await prefs.get_by_file_id(job_file_id)
    if not row:
        raise NotFoundException(message="No saved preferences for this file")
    return row
