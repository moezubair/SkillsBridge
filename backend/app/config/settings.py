from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# Always load .env next to the backend package (not relative to process cwd).
_BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    APP_NAME: str = "FastAPI Service"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"

    HOST: str = "0.0.0.0"
    PORT: int = 8000

    CORS_ORIGINS: list[str] = ["http://localhost:5173"]

    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379

    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "app_db"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"

    # PDF uploads: metadata in Postgres, bytes under UPLOAD_ROOT (relative to process cwd, usually backend/)
    UPLOAD_ROOT: str = "storage/uploads"
    MAX_PDF_UPLOAD_BYTES: int = 20 * 1024 * 1024

    # LandingAI ADE (parse PDF → markdown, then extract with JSON schema)
    LANDINGAI_API_KEY: str = ""
    LANDINGAI_BASE_URL: str = "https://api.va.landing.ai"
    LANDINGAI_PARSE_MODEL: str = "dpt-2-latest"
    LANDINGAI_EXTRACT_MODEL: str = "extract-latest"

    @property
    def postgres_dsn(self) -> str:
        return (
            f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    model_config = SettingsConfigDict(
        env_file=_BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
        # OS env vars normally win over .env; an *empty* LANDINGAI_API_KEY in the environment
        # (common on Windows / IDE run configs) would otherwise mask the real key in .env.
        env_ignore_empty=True,
    )


def get_settings() -> Settings:
    # No LRU cache: avoids stale env after .env edits, and cwd no longer matters for loading.
    return Settings()
