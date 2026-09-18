from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "KogniSync"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"

    # Database Configuration
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5434
    POSTGRES_USER: str = "kognisync"
    POSTGRES_PASSWORD: str = "kognisync_pass"
    POSTGRES_DB: str = "kognisync_db"
    DATABASE_URL: str = "postgresql+asyncpg://kognisync:kognisync_pass@localhost:5434/kognisync_db"

    # Redis Configuration
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6380
    REDIS_URL: str = "redis://localhost:6380/0"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
