from unittest.mock import AsyncMock

import pytest
from httpx import ASGITransport, AsyncClient

from app.core.postgres_client import PostgresClient
from app.core.redis_client import RedisClient
from app.dependencies import get_postgres, get_redis
from main import app


def _make_mock_redis() -> RedisClient:
    mock = AsyncMock(spec=RedisClient)
    mock.ping.return_value = True
    mock._settings = AsyncMock()
    mock._settings.APP_NAME = "FastAPI Service"
    mock._settings.APP_VERSION = "1.0.0"
    return mock


def _make_mock_postgres() -> PostgresClient:
    mock = AsyncMock(spec=PostgresClient)
    mock.ping.return_value = True
    return mock


@pytest.fixture
def mock_redis():
    return _make_mock_redis()


@pytest.fixture
def mock_postgres():
    return _make_mock_postgres()


@pytest.fixture
async def client(mock_redis, mock_postgres):
    app.dependency_overrides[get_redis] = lambda: mock_redis
    app.dependency_overrides[get_postgres] = lambda: mock_postgres

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()
