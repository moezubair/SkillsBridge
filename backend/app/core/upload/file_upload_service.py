"""Orchestrates validation → disk → database for PDF uploads."""

import asyncio
import json
from pathlib import Path
from uuid import UUID, uuid4

from app.core.exceptions import NotFoundException
from app.core.upload.disk_storage import LocalDiskFileStorage
from app.core.upload.payloads import IncomingPdfPayload
from app.core.upload.pdf_validator import PdfUploadValidator
from app.models.cv_extraction import CvExtractionDetail
from app.models.file import StoredFile, StoredFileCreate
from app.repositories.file_repository import FileRepository


class FileUploadService:
    """Application service: one entry point used by the HTTP layer."""

    def __init__(
        self,
        repository: FileRepository,
        storage: LocalDiskFileStorage,
        validator: PdfUploadValidator,
    ) -> None:
        self._repository = repository
        self._storage = storage
        self._validator = validator

    async def save_pdf(self, payload: IncomingPdfPayload) -> StoredFile:
        """Validate PDF, write to disk, insert metadata row, return the saved record."""
        self._validator.validate(
            payload.original_filename,
            payload.content_type,
            payload.data,
        )
        file_id = uuid4()
        storage_key = f"{file_id}.pdf"
        await self._storage.write(storage_key, payload.data)
        create = StoredFileCreate(
            id=file_id,
            original_filename=payload.original_filename,
            storage_key=storage_key,
            mime_type="application/pdf",
            size_bytes=len(payload.data),
        )
        return await self._repository.insert(create)

    async def get_metadata(self, file_id: UUID) -> StoredFile | None:
        return await self._repository.get_by_id(file_id)

    def resolve_disk_path(self, record: StoredFile) -> Path:
        """Path on disk for streaming a download (delegates to storage root + key)."""
        return self._storage.full_path(record.storage_key)

    def resolve_cv_extraction_json_path(self, file_id: UUID) -> Path:
        """Path to persisted extraction JSON (after POST extract-cv)."""
        return self._storage.full_path(f"extract/{file_id}.json")

    async def read_stored_pdf(self, file_id: UUID) -> tuple[bytes, StoredFile]:
        """Load bytes for a previously uploaded PDF (e.g. CV parsing pipeline)."""
        record = await self.get_metadata(file_id)
        if not record:
            raise NotFoundException(message="File not found")
        path = self.resolve_disk_path(record)
        if not path.is_file():
            raise NotFoundException(message="File content missing on disk")

        def _read() -> bytes:
            return path.read_bytes()

        data = await asyncio.to_thread(_read)
        return data, record

    async def save_cv_extraction_json(self, detail: CvExtractionDetail) -> str:
        """
        Persist the extraction result as JSON under UPLOAD_ROOT/extract/{file_id}.json
        (same disk tree as PDFs) for backups, Postman workflows, and local tooling.
        """
        storage_key = f"extract/{detail.file_id}.json"
        payload = json.dumps(
            detail.model_dump(mode="json"),
            ensure_ascii=False,
            indent=2,
        ).encode("utf-8")
        await self._storage.write(storage_key, payload)
        return storage_key
