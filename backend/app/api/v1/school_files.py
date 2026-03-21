"""School (transcript) PDF upload, download, and transcript extraction."""

from uuid import UUID

from fastapi import APIRouter, Depends, File, Query, UploadFile
from fastapi.responses import FileResponse

from app.api.v1.upload_body import read_upload_pdf_bytes
from app.config.settings import get_settings
from app.core.cv_extraction import SCHEMA_VERSION_TRANSCRIPT_V1
from app.core.exceptions import BadRequestException, NotFoundException
from app.core.upload import IncomingPdfPayload, ScopedFileUploadService
from app.dependencies import get_school_file_upload_service, get_transcript_extraction_service
from app.models.file import StoredFile
from app.models.transcript_extraction import TranscriptExtractionDetail, TranscriptExtractionRecord
from app.repositories.transcript_extraction_repository import transcript_to_summary
from app.services.transcript_extraction_service import TranscriptExtractionService

router = APIRouter()


@router.post("/upload", response_model=StoredFile)
async def upload_school_pdf(
    file: UploadFile = File(..., description="Transcript PDF document"),
    svc: ScopedFileUploadService = Depends(get_school_file_upload_service),
):
    """Store a transcript PDF under ``school/`` and record metadata in ``school_uploaded_files``."""
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


@router.post("/{school_file_id}/extract-transcript", response_model=TranscriptExtractionRecord)
async def extract_transcript_from_school_pdf(
    school_file_id: UUID,
    schema_version: str = Query(
        default=SCHEMA_VERSION_TRANSCRIPT_V1,
        description="Built-in schema version (e.g. transcript_v1)",
    ),
    svc: TranscriptExtractionService = Depends(get_transcript_extraction_service),
):
    detail = await svc.extract_transcript(school_file_id, schema_version=schema_version)
    return transcript_to_summary(detail)


@router.get("/{school_file_id}/transcript-extraction", response_model=TranscriptExtractionDetail)
async def get_latest_transcript_extraction(
    school_file_id: UUID,
    svc: TranscriptExtractionService = Depends(get_transcript_extraction_service),
):
    record = await svc.get_latest(school_file_id)
    if not record:
        raise NotFoundException(message="No transcript extraction found for this file")
    return record


@router.get("/{school_file_id}/transcript-extraction.json")
async def download_transcript_extraction_json(
    school_file_id: UUID,
    svc: ScopedFileUploadService = Depends(get_school_file_upload_service),
):
    record = await svc.get_metadata(school_file_id)
    if not record:
        raise NotFoundException(message="File not found")
    path = svc.resolve_transcript_extraction_json_path(school_file_id)
    if not path.is_file():
        raise NotFoundException(
            message="No transcript extraction JSON on disk — run POST extract-transcript first",
        )
    return FileResponse(
        path=str(path),
        media_type="application/json",
        filename=f"{school_file_id}-transcript-extraction.json",
    )


@router.get("/{school_file_id}/download")
async def download_school_pdf(
    school_file_id: UUID,
    svc: ScopedFileUploadService = Depends(get_school_file_upload_service),
):
    record = await svc.get_metadata(school_file_id)
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


@router.get("/{school_file_id}", response_model=StoredFile)
async def get_school_file_metadata(
    school_file_id: UUID,
    svc: ScopedFileUploadService = Depends(get_school_file_upload_service),
):
    record = await svc.get_metadata(school_file_id)
    if not record:
        raise NotFoundException(message="File not found")
    return record
