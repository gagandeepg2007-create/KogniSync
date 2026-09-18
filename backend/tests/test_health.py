from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_basic_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["project"] == "KogniSync"


def test_db_connectivity_endpoint():
    response = client.get("/health/db")
    assert response.status_code == 200
    data = response.json()
    assert data["database"] == "healthy"
    assert data["engine"] == "postgresql"
    assert data["port"] == 5434


def test_redis_connectivity_endpoint():
    response = client.get("/health/redis")
    assert response.status_code == 200
    data = response.json()
    assert data["redis"] == "healthy"
    assert data["port"] == 6380
