import asyncpg

from app.config.settings import Settings


class PostgresClient:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._pool: asyncpg.Pool | None = None

    async def connect(self) -> None:
        self._pool = await asyncpg.create_pool(
            host=self._settings.POSTGRES_HOST,
            port=self._settings.POSTGRES_PORT,
            database=self._settings.POSTGRES_DB,
            user=self._settings.POSTGRES_USER,
            password=self._settings.POSTGRES_PASSWORD,
            min_size=2,
            max_size=10,
        )

    async def disconnect(self) -> None:
        if self._pool:
            await self._pool.close()
            self._pool = None

    @property
    def pool(self) -> asyncpg.Pool:
        if self._pool is None:
            raise RuntimeError("PostgreSQL pool is not connected")
        return self._pool

    async def ping(self) -> bool:
        try:
            async with self.pool.acquire() as conn:
                await conn.fetchval("SELECT 1")
            return True
        except Exception:
            return False
