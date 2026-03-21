from fastapi import Request

from app.config.settings import get_settings
from app.core.landingai.ade_client import AdeClient
from app.core.postgres_client import PostgresClient
from app.core.redis_client import RedisClient
from app.core.upload import FileUploadService, LocalDiskFileStorage, PdfUploadValidator
from app.repositories.cv_extraction_repository import CvExtractionRepository
from app.repositories.student_extras_repository import StudentExtrasRepository
from app.repositories.transcript_extraction_repository import TranscriptExtractionRepository
from app.repositories.file_repository import FileRepository
from app.repositories.job_discovery_repository import JobDiscoveryRepository
from app.repositories.harvard_catalog_cache_repository import HarvardCatalogCacheRepository
from app.repositories.job_preferences_repository import JobPreferencesRepository
from app.services.cv_extraction_service import CvExtractionService
from app.services.transcript_extraction_service import TranscriptExtractionService
from app.services.job_search_service import JobSearchService
from app.services.school_match_service import SchoolMatchService


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


def get_transcript_extraction_repository(request: Request) -> TranscriptExtractionRepository:
    settings = get_settings()
    return TranscriptExtractionRepository(settings, get_postgres(request))


def get_transcript_extraction_service(request: Request) -> TranscriptExtractionService:
    settings = get_settings()
    return TranscriptExtractionService(
        get_file_upload_service(request),
        get_ade_client(request),
        get_transcript_extraction_repository(request),
        settings,
    )


def get_student_extras_repository(request: Request) -> StudentExtrasRepository:
    settings = get_settings()
    return StudentExtrasRepository(settings, get_postgres(request))


def get_harvard_catalog_cache_repository(request: Request) -> HarvardCatalogCacheRepository:
    settings = get_settings()
    return HarvardCatalogCacheRepository(settings, get_postgres(request))


def get_school_match_service(request: Request) -> SchoolMatchService:
    settings = get_settings()
    return SchoolMatchService(
        settings,
        get_file_repository(request),
        get_transcript_extraction_repository(request),
        get_student_extras_repository(request),
        get_harvard_catalog_cache_repository(request),
    )


def get_file_repository(request: Request) -> FileRepository:
    settings = get_settings()
    return FileRepository(settings, get_postgres(request))


def get_job_preferences_repository(request: Request) -> JobPreferencesRepository:
    settings = get_settings()
    return JobPreferencesRepository(settings, get_postgres(request))


def get_job_discovery_repository(request: Request) -> JobDiscoveryRepository:
    settings = get_settings()
    return JobDiscoveryRepository(settings, get_postgres(request))


def get_job_search_service(request: Request) -> JobSearchService:
    settings = get_settings()
    return JobSearchService(
        settings,
        get_file_repository(request),
        get_cv_extraction_repository(request),
        get_job_preferences_repository(request),
        get_job_discovery_repository(request),
    )
