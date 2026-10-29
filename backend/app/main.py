from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.core.config import settings
from app.core.logging import logger, setup_logging
from app.db.init_app_tables import init_application_tables
from app.api.routes.health import router as health_router
from app.api.routes.booking import router as booking_router
from app.api.routes.journeys import router as journeys_router
from app.api.routes.ai import router as ai_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    logger.info(f"Starting {settings.PROJECT_NAME} backend service...")
    try:
        await init_application_tables()
    except Exception as exc:
        logger.warning(f"Database table auto-init skipped or deferred ({exc})")
    yield
    logger.info(f"Shutting down {settings.PROJECT_NAME} backend service...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="0.1.0",
    debug=settings.DEBUG,
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(health_router)
app.include_router(booking_router)
app.include_router(journeys_router)
app.include_router(ai_router)

# Mount frontend static files if directory exists
frontend_dir = Path(__file__).resolve().parent.parent.parent / "frontend"
dist_dir = frontend_dir / "dist"
target_html_dir = dist_dir if (dist_dir / "index.html").exists() else frontend_dir

if target_html_dir.exists() and (target_html_dir / "index.html").exists():
    @app.get("/explore", include_in_schema=False)
    @app.get("/bookings", include_in_schema=False)
    @app.get("/details", include_in_schema=False)
    @app.get("/confirmation", include_in_schema=False)
    async def serve_spa_routes():
        return FileResponse(str(target_html_dir / "index.html"))

    app.mount("/", StaticFiles(directory=str(target_html_dir), html=True), name="frontend")
