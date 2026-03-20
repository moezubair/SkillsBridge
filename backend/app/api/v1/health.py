from fastapi import APIRouter, Depends

from app.core.postgres_client import PostgresClient
from app.core.redis_client import RedisClient
from app.dependencies import get_postgres, get_redis

router = APIRouter()


@router.get("/health")
async def health_check(
    redis_client: RedisClient = Depends(get_redis),
    postgres_client: PostgresClient = Depends(get_postgres),
):
    redis_status = await redis_client.ping()
    postgres_status = await postgres_client.ping()

    dependencies = [
        {"name": "redis", "status": redis_status},
        {"name": "postgres", "status": postgres_status},
    ]

    all_healthy = all(dep["status"] for dep in dependencies)

    return {
        "status": "healthy" if all_healthy else "degraded",
        "service": redis_client._settings.APP_NAME,
        "version": redis_client._settings.APP_VERSION,
        "dependencies": dependencies,
    }
