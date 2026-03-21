"""CRUD for job preferences linked to an uploaded CV file (`file_id`)."""

from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.core.exceptions import NotFoundException
from app.dependencies import get_file_repository, get_job_preferences_repository
from app.models.job import JobPreferencesBody, JobPreferencesRecord
from app.repositories.file_repository import FileRepository
from app.repositories.job_preferences_repository import JobPreferencesRepository

router = APIRouter()


@router.put("", response_model=JobPreferencesRecord)
async def put_job_preferences(
    file_id: UUID = Query(..., description="Uploaded PDF / CV file id"),
    body: JobPreferencesBody = ...,
    files: FileRepository = Depends(get_file_repository),
    prefs: JobPreferencesRepository = Depends(get_job_preferences_repository),
):
    meta = await files.get_by_id(file_id)
    if not meta:
        raise NotFoundException(message="File not found")
    payload = body.model_dump(exclude_none=True)
    return await prefs.upsert(file_id=file_id, preferences=payload)


@router.get("", response_model=JobPreferencesRecord)
async def get_job_preferences(
    file_id: UUID = Query(..., description="Uploaded PDF / CV file id"),
    prefs: JobPreferencesRepository = Depends(get_job_preferences_repository),
):
    row = await prefs.get_by_file_id(file_id)
    if not row:
        raise NotFoundException(message="No saved preferences for this file")
    return row
