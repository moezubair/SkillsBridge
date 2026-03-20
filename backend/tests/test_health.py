import pytest


@pytest.mark.asyncio
async def test_health_check_healthy(client):
    response = await client.get("/api/v1/health")
    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "FastAPI Service"
    assert data["version"] == "1.0.0"
    assert len(data["dependencies"]) == 2
    assert all(dep["status"] is True for dep in data["dependencies"])


@pytest.mark.asyncio
async def test_health_check_degraded(client, mock_redis):
    mock_redis.ping.return_value = False

    response = await client.get("/api/v1/health")
    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "degraded"
