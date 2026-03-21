from fastapi import Request

from app.config.settings import get_settings
from app.core.landingai.ade_client import AdeClient
from app.core.postgres_client import PostgresClient
from app.core.redis_client import RedisClient
from app.core.upload import FileUploadService, LocalDiskFileStorage, PdfUploadValidator
from app.repositories.cv_extraction_repository import CvExtractionRepository
from app.repositories.file_repository import FileRepository
from app.services.cv_extraction_service import CvExtractionService


def get_redis(request: Request) -> RedisClient:
    return request.app.state.redis_client


def get_postgres(request: Request) -> PostgresClient:
    return request.app.state.postgres_client


def get_file_upload_service(request: Request) -> FileUploadService:
    """Build upload pipeline with injected settings, DB, validator, and disk storage."""
    settings = get_settings()
    postgres = get_postgres(request)
    repository = FileRepository(settings, postgres)
    storage = LocalDiskFileStorage(settings)
    validator = PdfUploadValidator(settings)
    return FileUploadService(repository, storage, validator)


def get_ade_client(request: Request) -> AdeClient:
    return request.app.state.ade_client


def get_cv_extraction_repository(request: Request) -> CvExtractionRepository:
    settings = get_settings()
    return CvExtractionRepository(settings, get_postgres(request))


def get_cv_extraction_service(request: Request) -> CvExtractionService:
    settings = get_settings()
    return CvExtractionService(
        get_file_upload_service(request),
        get_ade_client(request),
        get_cv_extraction_repository(request),
        settings,
    )
