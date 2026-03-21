"""Shared helpers for multipart PDF upload endpoints."""

from fastapi import UploadFile

from app.config.settings import Settings
from app.core.exceptions import BadRequestException


async def read_upload_pdf_bytes(file: UploadFile, settings: Settings) -> bytes:
    """Read upload in chunks so oversized files fail before loading fully into memory."""
    chunks: list[bytes] = []
    total = 0
    chunk_size = 64 * 1024
    while True:
        chunk = await file.read(chunk_size)
        if not chunk:
            break
        total += len(chunk)
        if total > settings.MAX_PDF_UPLOAD_BYTES:
            raise BadRequestException(
                message=f"File too large (max {settings.MAX_PDF_UPLOAD_BYTES // (1024 * 1024)} MB)",
            )
        chunks.append(chunk)
    return b"".join(chunks)
