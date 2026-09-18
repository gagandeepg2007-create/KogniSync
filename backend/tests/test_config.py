from app.core.config import settings


def test_config_loading():
    assert settings.PROJECT_NAME == "KogniSync"
    assert settings.POSTGRES_PORT == 5434
    assert settings.REDIS_PORT == 6380
    assert "postgresql+asyncpg://" in settings.DATABASE_URL
    assert "redis://" in settings.REDIS_URL
