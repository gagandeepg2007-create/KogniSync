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

    # Authoritative Canonical Transport Database
    CANONICAL_DB_PATH: str = "BookingInventory/data/APS-05.db"

    def resolve_canonical_db_path(self) -> str:
        import os
        from pathlib import Path
        # Check current working directory or relative to project root
        p = Path(self.CANONICAL_DB_PATH)
        if p.exists():
            return str(p.resolve())
        # Try parent directory if running from backend/
        p_parent = Path("..") / self.CANONICAL_DB_PATH
        if p_parent.exists():
            return str(p_parent.resolve())
        # Check absolute from file location
        p_abs = Path(__file__).resolve().parent.parent.parent.parent / self.CANONICAL_DB_PATH
        if p_abs.exists():
            return str(p_abs)
        return str(p)

    # Gemini AI Configuration
    GEMINI_API_KEY: str | None = None
    GEMINI_MODEL: str = "models/gemini-3.5-flash-lite"

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
