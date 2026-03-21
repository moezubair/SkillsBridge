"""Enforces PDF-only uploads (extension, declared type, magic bytes)."""

from app.config.settings import Settings
from app.core.exceptions import BadRequestException


class PdfUploadValidator:
    """Validates that a payload is an acceptable PDF before we persist it."""

    PDF_MAGIC = b"%PDF"

    def __init__(self, settings: Settings) -> None:
        self._max_bytes = settings.MAX_PDF_UPLOAD_BYTES

    def validate(self, original_filename: str, content_type: str | None, data: bytes) -> None:
        if len(data) > self._max_bytes:
            raise BadRequestException(
                message=f"File too large (max {self._max_bytes // (1024 * 1024)} MB)",
            )
        if not data:
            raise BadRequestException(message="Empty file")
        if not original_filename.lower().endswith(".pdf"):
            raise BadRequestException(message="Only PDF files are allowed (.pdf extension)")
        if content_type:
            # Strip parameters e.g. application/pdf; charset=binary
            base = content_type.split(";", 1)[0].strip().lower()
            if base not in ("application/pdf", "application/x-pdf") and "pdf" not in base:
                raise BadRequestException(message="Content-Type must be application/pdf")
        if not data.startswith(self.PDF_MAGIC):
            raise BadRequestException(message="File does not look like a valid PDF")
