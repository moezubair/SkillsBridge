"""PDF upload: validation, disk storage, and DB-backed file metadata."""

from app.core.upload.disk_storage import LocalDiskFileStorage
from app.core.upload.file_upload_service import ScopedFileUploadService
from app.core.upload.payloads import IncomingPdfPayload
from app.core.upload.pdf_validator import PdfUploadValidator
from app.core.upload.schema import (
    ensure_job_uploaded_files_table,
    ensure_school_uploaded_files_table,
    ensure_scoped_upload_fk_migration,
    ensure_uploaded_files_table,
)

__all__ = [
    "PdfUploadValidator",
    "LocalDiskFileStorage",
    "ensure_uploaded_files_table",
    "ensure_job_uploaded_files_table",
    "ensure_school_uploaded_files_table",
    "ensure_scoped_upload_fk_migration",
    "ScopedFileUploadService",
    "IncomingPdfPayload",
]
