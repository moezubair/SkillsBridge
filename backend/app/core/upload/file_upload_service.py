"""Orchestrates validation → disk → database for scoped PDF uploads (job vs school)."""

import asyncio
import json
from pathlib import Path
from typing import Literal
from uuid import UUID, uuid4

from app.core.exceptions import NotFoundException
from app.core.upload.disk_storage import LocalDiskFileStorage
from app.core.upload.payloads import IncomingPdfPayload
from app.core.upload.pdf_validator import PdfUploadValidator
from app.models.cv_extraction import CvExtractionDetail
from app.models.file import StoredFile, StoredFileCreate
from app.models.transcript_extraction import TranscriptExtractionDetail
from app.repositories.job_file_repository import JobFileRepository
from app.repositories.school_file_repository import SchoolFileRepository


class ScopedFileUploadService:
    """Writes under ``jobs/`` or ``school/`` in UPLOAD_ROOT; pairs with matching repository."""

    def __init__(
        self,
        repository: JobFileRepository | SchoolFileRepository,
        storage: LocalDiskFileStorage,
        validator: PdfUploadValidator,
        disk_prefix: Literal["jobs", "school"],
    ) -> None:
        self._repository = repository
        self._storage = storage
        self._validator = validator
        self._prefix = disk_prefix

    async def save_pdf(self, payload: IncomingPdfPayload) -> StoredFile:
        self._validator.validate(
            payload.original_filename,
            payload.content_type,
            payload.data,
        )
        file_id = uuid4()
        storage_key = f"{self._prefix}/{file_id}.pdf"
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
        return self._storage.full_path(record.storage_key)

    def resolve_cv_extraction_json_path(self, file_id: UUID) -> Path:
        return self._storage.full_path(f"{self._prefix}/extract/{file_id}.json")

    def resolve_transcript_extraction_json_path(self, file_id: UUID) -> Path:
        return self._storage.full_path(f"{self._prefix}/extract-transcript/{file_id}.json")

    async def read_stored_pdf(
        self,
        file_id: UUID,
        *,
        not_found_message: str | None = None,
        missing_bytes_message: str | None = None,
    ) -> tuple[bytes, StoredFile]:
        record = await self.get_metadata(file_id)
        if not record:
            raise NotFoundException(
                message=not_found_message or "File not found",
            )
        path = self.resolve_disk_path(record)
        if not path.is_file():
            raise NotFoundException(
                message=missing_bytes_message or "File content missing on disk",
            )

        def _read() -> bytes:
            return path.read_bytes()

        data = await asyncio.to_thread(_read)
        return data, record

    async def save_cv_extraction_json(self, detail: CvExtractionDetail) -> str:
        storage_key = f"{self._prefix}/extract/{detail.file_id}.json"
        payload = json.dumps(
            detail.model_dump(mode="json"),
            ensure_ascii=False,
            indent=2,
        ).encode("utf-8")
        await self._storage.write(storage_key, payload)
        return storage_key

    async def save_transcript_extraction_json(self, detail: TranscriptExtractionDetail) -> str:
        storage_key = f"{self._prefix}/extract-transcript/{detail.file_id}.json"
        payload = json.dumps(
            detail.model_dump(mode="json"),
            ensure_ascii=False,
            indent=2,
        ).encode("utf-8")
        await self._storage.write(storage_key, payload)
        return storage_key
