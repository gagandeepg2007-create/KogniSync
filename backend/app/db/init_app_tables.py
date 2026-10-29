import asyncio
import os
import sys

# Ensure backend root is in Python path for standalone script execution
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from sqlalchemy import text
from app.db.database import engine
from app.db.models.base import AppBase
from app.core.logging import logger


async def init_application_tables() -> None:
    """
    Ensures application-owned tables in the 'app' schema (such as app.booking_lifecycle_events
    and app.idempotency_records) are created in PostgreSQL, strictly preserving the 20
    canonical tables in the 'public' schema.
    """
    async with engine.begin() as conn:
        logger.info("Initializing application-owned database tables in schema 'app'...")
        await conn.execute(text("CREATE SCHEMA IF NOT EXISTS app;"))
        await conn.run_sync(AppBase.metadata.create_all)
        logger.info("Application-owned database tables in schema 'app' verified.")


if __name__ == "__main__":
    asyncio.run(init_application_tables())
