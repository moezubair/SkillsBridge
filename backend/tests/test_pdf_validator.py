import pytest

from app.config.settings import Settings
from app.core.exceptions import BadRequestException
from app.core.upload.pdf_validator import PdfUploadValidator


def _settings(max_bytes: int = 1024) -> Settings:
    return Settings(MAX_PDF_UPLOAD_BYTES=max_bytes)  # type: ignore[call-arg]


def test_accepts_minimal_valid_pdf():
    v = PdfUploadValidator(_settings(100))
    v.validate("report.pdf", "application/pdf", b"%PDF-1.4 minimal")


def test_rejects_non_pdf_extension():
    v = PdfUploadValidator(_settings(100))
    with pytest.raises(BadRequestException):
        v.validate("x.txt", "application/pdf", b"%PDF-1.4")


def test_rejects_bad_magic():
    v = PdfUploadValidator(_settings(100))
    with pytest.raises(BadRequestException):
        v.validate("x.pdf", "application/pdf", b"NOTPDF")


def test_rejects_oversized():
    v = PdfUploadValidator(_settings(10))
    with pytest.raises(BadRequestException):
        v.validate("x.pdf", "application/pdf", b"%PDF-1.4" + b"x" * 20)
