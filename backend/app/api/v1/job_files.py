"""Job (CV) PDF upload, download, and CV extraction."""

from uuid import UUID

from fastapi import APIRouter, Depends, File, Query, UploadFile
from fastapi.responses import FileResponse

from app.api.v1.upload_body import read_upload_pdf_bytes
from app.config.settings import get_settings
from app.core.cv_extraction import SCHEMA_VERSION_CV_V1
from app.core.exceptions import BadRequestException, NotFoundException
from app.core.upload import IncomingPdfPayload, ScopedFileUploadService
from app.dependencies import get_cv_extraction_service, get_job_file_upload_service
from app.models.cv_extraction import CvExtractionDetail, CvExtractionRecord
from app.models.file import StoredFile
from app.repositories.cv_extraction_repository import to_summary
from app.services.cv_extraction_service import CvExtractionService

router = APIRouter()


@router.post("/upload", response_model=StoredFile)
async def upload_job_pdf(
    file: UploadFile = File(..., description="CV PDF document"),
    svc: ScopedFileUploadService = Depends(get_job_file_upload_service),
):
    """Store a career/CV PDF under ``jobs/`` and record metadata in ``job_uploaded_files``."""
    settings = get_settings()
    if not file.filename:
        raise BadRequestException(message="Filename is required")
    data = await read_upload_pdf_bytes(file, settings)
    payload = IncomingPdfPayload(
        original_filename=file.filename,
        content_type=file.content_type,
        data=data,
    )
    return await svc.save_pdf(payload)


@router.post("/{job_file_id}/extract-cv", response_model=CvExtractionRecord)
async def extract_cv_from_job_pdf(
    job_file_id: UUID,
    schema_version: str = Query(
        default=SCHEMA_VERSION_CV_V1,
        description="Built-in schema version (e.g. cv_v1)",
    ),
    svc: CvExtractionService = Depends(get_cv_extraction_service),
):
    detail = await svc.extract_cv(job_file_id, schema_version=schema_version)
    return to_summary(detail)


@router.get("/{job_file_id}/cv-extraction", response_model=CvExtractionDetail)
async def get_latest_cv_extraction(
    job_file_id: UUID,
    svc: CvExtractionService = Depends(get_cv_extraction_service),
):
    record = await svc.get_latest(job_file_id)
    if not record:
        raise NotFoundException(message="No CV extraction found for this file")
    return record


@router.get("/{job_file_id}/cv-extraction.json")
async def download_cv_extraction_json(
    job_file_id: UUID,
    svc: ScopedFileUploadService = Depends(get_job_file_upload_service),
):
    record = await svc.get_metadata(job_file_id)
    if not record:
        raise NotFoundException(message="File not found")
    path = svc.resolve_cv_extraction_json_path(job_file_id)
    if not path.is_file():
        raise NotFoundException(
            message="No extraction JSON on disk — run POST extract-cv for this file first",
        )
    return FileResponse(
        path=str(path),
        media_type="application/json",
        filename=f"{job_file_id}-cv-extraction.json",
    )


@router.get("/{job_file_id}/download")
async def download_job_pdf(
    job_file_id: UUID,
    svc: ScopedFileUploadService = Depends(get_job_file_upload_service),
):
    record = await svc.get_metadata(job_file_id)
    if not record:
        raise NotFoundException(message="File not found")
    path = svc.resolve_disk_path(record)
    if not path.is_file():
        raise NotFoundException(message="File content missing on disk")
    return FileResponse(
        path=str(path),
        media_type="application/pdf",
        filename=record.original_filename,
    )


@router.get("/{job_file_id}", response_model=StoredFile)
async def get_job_file_metadata(
    job_file_id: UUID,
    svc: ScopedFileUploadService = Depends(get_job_file_upload_service),
):
    record = await svc.get_metadata(job_file_id)
    if not record:
        raise NotFoundException(message="File not found")
    return record
