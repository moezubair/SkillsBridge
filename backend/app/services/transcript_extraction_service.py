"""Run LandingAI parse + extract on a stored transcript PDF."""

from uuid import UUID

import httpx

from app.config.settings import Settings
from app.core.cv_extraction import SCHEMA_VERSION_TRANSCRIPT_V1, load_transcript_schema
from app.core.exceptions import AppException, BadRequestException
from app.core.landingai.ade_client import AdeClient, AdeExtractResult, LandingAiApiError
from app.core.upload import ScopedFileUploadService
from app.models.transcript_extraction import TranscriptExtractionDetail
from app.repositories.transcript_extraction_repository import TranscriptExtractionRepository


class TranscriptExtractionService:
    def __init__(
        self,
        files: ScopedFileUploadService,
        ade: AdeClient,
        repository: TranscriptExtractionRepository,
        settings: Settings,
    ) -> None:
        self._files = files
        self._ade = ade
        self._repository = repository
        self._settings = settings

    async def extract_transcript(
        self,
        file_id: UUID,
        schema_version: str = SCHEMA_VERSION_TRANSCRIPT_V1,
    ) -> TranscriptExtractionDetail:
        if not self._settings.LANDINGAI_API_KEY.strip():
            raise AppException(
                message="LandingAI is not configured (set LANDINGAI_API_KEY)",
                status_code=503,
            )
        try:
            schema = load_transcript_schema(schema_version)
        except ValueError as exc:
            raise BadRequestException(message=str(exc)) from exc
        pdf_bytes, record = await self._files.read_stored_pdf(
            file_id,
            not_found_message=(
                "No school transcript upload with this id. "
                "Upload a PDF with POST /api/v1/school/files/upload (multipart field `file`), "
                "then call extract-transcript with the returned `id`."
            ),
            missing_bytes_message=(
                "Transcript PDF bytes missing on disk for this school upload id."
            ),
        )
        try:
            parsed = await self._ade.parse_pdf(pdf_bytes, record.original_filename)
            extracted = await self._ade.extract(parsed.markdown, schema)
        except LandingAiApiError as exc:
            raise AppException(message=str(exc), status_code=502) from exc
        except httpx.HTTPError as exc:
            raise AppException(
                message=f"LandingAI network error: {exc}",
                status_code=502,
            ) from exc

        status = _derive_status(parsed.http_status, extracted)
        try:
            detail = await self._repository.insert(
                file_id=file_id,
                schema_version=schema_version,
                status=status,
                extraction=extracted.extraction,
                extraction_metadata=extracted.extraction_metadata or None,
                parse_metadata=parsed.metadata,
                extract_metadata=extracted.metadata or None,
            )
        except Exception as exc:
            raise AppException(
                message=f"Failed to save transcript extraction: {exc}",
                status_code=500,
            ) from exc

        try:
            await self._files.save_transcript_extraction_json(detail)
        except Exception as exc:
            raise AppException(
                message=f"Transcript saved to database but failed to write JSON file: {exc}",
                status_code=500,
            ) from exc

        return detail

    async def get_latest(self, file_id: UUID) -> TranscriptExtractionDetail | None:
        return await self._repository.get_latest_for_file(file_id)


def _derive_status(parse_http_status: int, extracted: AdeExtractResult) -> str:
    violation = extracted.metadata.get("schema_violation_error")
    if parse_http_status == 206 or extracted.http_status == 206 or violation:
        return "partial"
    return "complete"
