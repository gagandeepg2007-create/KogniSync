from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.core.config import settings
from app.core.logging import logger, setup_logging
from app.db.init_app_tables import init_application_tables
from app.api.routes.health import router as health_router
from app.api.routes.booking import router as booking_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    logger.info(f"Starting {settings.PROJECT_NAME} backend service...")
    await init_application_tables()
    yield
    logger.info(f"Shutting down {settings.PROJECT_NAME} backend service...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="0.1.0",
    debug=settings.DEBUG,
    lifespan=lifespan
)

app.include_router(health_router)
app.include_router(booking_router)
