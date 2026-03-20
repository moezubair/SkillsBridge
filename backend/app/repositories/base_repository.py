from app.config.settings import Settings
from app.core.postgres_client import PostgresClient


class BaseRepository:
    def __init__(self, settings: Settings, postgres: PostgresClient) -> None:
        self._settings = settings
        self._postgres = postgres

    @property
    def pool(self):
        return self._postgres.pool
