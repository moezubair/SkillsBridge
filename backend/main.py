import logging
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.config.settings import get_settings
from app.core.exceptions import AppException
from app.core.postgres_client import PostgresClient
from app.core.redis_client import RedisClient
from app.core.cv_extraction.db_schema import ensure_cv_extractions_table
from app.core.jobs.db_schema import ensure_job_tables
from app.core.school.db_schema import ensure_school_tables
from app.core.landingai.ade_client import AdeClient
from app.core.school_match.db_schema import ensure_university_matches_table, ensure_program_assessments_table
from app.core.upload.schema import (
    ensure_job_uploaded_files_table,
    ensure_scoped_upload_fk_migration,
    ensure_school_uploaded_files_table,
    ensure_uploaded_files_table,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()

    logging.basicConfig(level=settings.LOG_LEVEL)
    logger = logging.getLogger(__name__)

    # Initialize Redis
    redis_client = RedisClient(settings)
    await redis_client.connect()
    app.state.redis_client = redis_client
    logger.info("Redis connected")

    # Initialize PostgreSQL
    postgres_client = PostgresClient(settings)
    await postgres_client.connect()
    app.state.postgres_client = postgres_client
    logger.info("PostgreSQL connected")

    await ensure_uploaded_files_table(postgres_client.pool)
    await ensure_job_uploaded_files_table(postgres_client.pool)
    await ensure_school_uploaded_files_table(postgres_client.pool)
    logger.info("Upload schema ready (legacy + job + school)")

    await ensure_cv_extractions_table(postgres_client.pool)
    logger.info("CV extraction schema ready")

    await ensure_job_tables(postgres_client.pool)
    logger.info("Job discovery schema ready")

    await ensure_school_tables(postgres_client.pool)
    logger.info("School / transcript schema ready")

    await ensure_university_matches_table(postgres_client.pool)
    await ensure_program_assessments_table(postgres_client.pool)
    logger.info("School match schema ready")

    await ensure_scoped_upload_fk_migration(postgres_client.pool)
    logger.info("Scoped upload FK migration applied")

    ade_client = AdeClient()
    app.state.ade_client = ade_client
    logger.info("LandingAI ADE client initialized")

    yield

    # Cleanup
    await redis_client.disconnect()
    logger.info("Redis disconnected")
    await postgres_client.disconnect()
    logger.info("PostgreSQL disconnected")

    await ade_client.aclose()
    logger.info("LandingAI ADE client closed")


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.message},
        )

    app.include_router(api_router)

    return app


app = create_app()

if __name__ == "__main__":
    settings = get_settings()
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
