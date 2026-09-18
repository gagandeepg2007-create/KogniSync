from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
import redis.asyncio as aioredis

from app.core.config import settings
from app.db.database import get_db

router = APIRouter(tags=["Health"])


@router.get("/health", summary="Basic service health check")
async def health_check():
    return {
        "status": "ok",
        "project": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "version": "0.1.0"
    }


@router.get("/health/db", summary="PostgreSQL database connectivity check")
async def health_check_db(db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(text("SELECT 1"))
        val = result.scalar()
        if val == 1:
            return {"database": "healthy", "engine": "postgresql", "port": settings.POSTGRES_PORT}
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database query returned unexpected result")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=f"Database connection failed: {str(e)}")


@router.get("/health/redis", summary="Redis connectivity check")
async def health_check_redis():
    try:
        client = aioredis.from_url(settings.REDIS_URL)
        pong = await client.ping()
        await client.aclose()
        if pong:
            return {"redis": "healthy", "port": settings.REDIS_PORT}
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Redis ping failed")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=f"Redis connection failed: {str(e)}")
