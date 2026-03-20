from fastapi import Request

from app.core.postgres_client import PostgresClient
from app.core.redis_client import RedisClient


def get_redis(request: Request) -> RedisClient:
    return request.app.state.redis_client


def get_postgres(request: Request) -> PostgresClient:
    return request.app.state.postgres_client
