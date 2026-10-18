import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_liveness(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "timestamp" in data
    assert "service" in data


@pytest.mark.asyncio
async def test_health_readiness(client: AsyncClient):
    response = await client.get("/health/readiness")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ("ok", "degraded")
    assert "integrations" in data
    assert "gemini" in data["integrations"]
    assert "database" in data["integrations"]
    assert "nha_pmjay" in data["integrations"]
    assert "reminders" in data["integrations"]
