"""IELTS + skills linked to an uploaded file (school matching)."""

from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.core.exceptions import NotFoundException
from app.dependencies import get_school_file_repository, get_student_extras_repository
from app.models.student_extras import StudentExtrasBody, StudentExtrasRecord
from app.repositories.school_file_repository import SchoolFileRepository
from app.repositories.student_extras_repository import StudentExtrasRepository

router = APIRouter()


@router.put("", response_model=StudentExtrasRecord)
async def put_student_extras(
    school_file_id: UUID = Query(..., description="School upload id from POST /api/v1/school/files/upload"),
    body: StudentExtrasBody = ...,
    files: SchoolFileRepository = Depends(get_school_file_repository),
    repo: StudentExtrasRepository = Depends(get_student_extras_repository),
):
    meta = await files.get_by_id(school_file_id)
    if not meta:
        raise NotFoundException(message="File not found")
    ielts_dict = body.ielts.model_dump(exclude_none=True) if body.ielts else None
    return await repo.upsert(file_id=school_file_id, ielts=ielts_dict, skills=body.skills)


@router.get("", response_model=StudentExtrasRecord)
async def get_student_extras(
    school_file_id: UUID = Query(..., description="School upload id"),
    repo: StudentExtrasRepository = Depends(get_student_extras_repository),
):
    row = await repo.get_by_file_id(school_file_id)
    if not row:
        raise NotFoundException(message="No saved student extras for this file")
    return row
