"""Multipart PDF upload, download, and CV extraction endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, File, Query, UploadFile
from fastapi.responses import FileResponse

from app.config.settings import get_settings
from app.core.cv_extraction import SCHEMA_VERSION_CV_V1
from app.core.exceptions import BadRequestException, NotFoundException
from app.core.upload import FileUploadService, IncomingPdfPayload
from app.dependencies import get_cv_extraction_service, get_file_upload_service
from app.models.cv_extraction import CvExtractionDetail, CvExtractionRecord
from app.models.file import StoredFile
from app.repositories.cv_extraction_repository import to_summary
from app.services.cv_extraction_service import CvExtractionService

router = APIRouter()


async def _read_body_limited(file: UploadFile, max_bytes: int) -> bytes:
    """Read upload in chunks so oversized files fail before loading fully into memory."""
    chunks: list[bytes] = []
    total = 0
    chunk_size = 64 * 1024
    while True:
        chunk = await file.read(chunk_size)
        if not chunk:
            break
        total += len(chunk)
        if total > max_bytes:
            raise BadRequestException(
                message=f"File too large (max {max_bytes // (1024 * 1024)} MB)",
            )
        chunks.append(chunk)
    return b"".join(chunks)


@router.post("/upload", response_model=StoredFile)
async def upload_pdf(
    file: UploadFile = File(..., description="PDF document"),
    svc: FileUploadService = Depends(get_file_upload_service),
):
    """Accept a single PDF, store bytes on disk and metadata in the database."""
    settings = get_settings()
    if not file.filename:
        raise BadRequestException(message="Filename is required")
    data = await _read_body_limited(file, settings.MAX_PDF_UPLOAD_BYTES)
    payload = IncomingPdfPayload(
        original_filename=file.filename,
        content_type=file.content_type,
        data=data,
    )
    return await svc.save_pdf(payload)


@router.post("/{file_id}/extract-cv", response_model=CvExtractionRecord)
async def extract_cv_from_uploaded_pdf(
    file_id: UUID,
    schema_version: str = Query(
        default=SCHEMA_VERSION_CV_V1,
        description="Built-in schema version (e.g. cv_v1)",
    ),
    svc: CvExtractionService = Depends(get_cv_extraction_service),
):
    """Parse PDF with LandingAI ADE, extract fields by JSON schema, persist to cv_extractions."""
    detail = await svc.extract_cv(file_id, schema_version=schema_version)
    return to_summary(detail)


@router.get("/{file_id}/cv-extraction", response_model=CvExtractionDetail)
async def get_latest_cv_extraction(
    file_id: UUID,
    svc: CvExtractionService = Depends(get_cv_extraction_service),
):
    """Return the most recent CV extraction for this uploaded file."""
    record = await svc.get_latest(file_id)
    if not record:
        raise NotFoundException(message="No CV extraction found for this file")
    return record


@router.get("/{file_id}", response_model=StoredFile)
async def get_file_metadata(
    file_id: UUID,
    svc: FileUploadService = Depends(get_file_upload_service),
):
    """Return stored metadata for an uploaded file."""
    record = await svc.get_metadata(file_id)
    if not record:
        raise NotFoundException(message="File not found")
    return record


@router.get("/{file_id}/download")
async def download_pdf(
    file_id: UUID,
    svc: FileUploadService = Depends(get_file_upload_service),
):
    """Stream the PDF from disk using the original filename for Content-Disposition."""
    record = await svc.get_metadata(file_id)
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
