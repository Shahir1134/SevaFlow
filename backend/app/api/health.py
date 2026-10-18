from datetime import datetime, timezone
from typing import Any
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.config import get_settings
from app.database import AsyncSessionLocal
from app.integrations.registry import IntegrationStatus, registry

router = APIRouter(tags=["Health & Diagnostics"])
settings = get_settings()


@router.get("/health")
async def health_check() -> dict[str, Any]:
    """Basic liveness probe."""
    return {
        "status": "ok",
        "service": settings.app_name,
        "environment": settings.app_env,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/health/readiness")
async def readiness_probe() -> dict[str, Any]:
    """Readiness probe checking database connectivity and external service integrations.
    If database is unreachable, status is 'degraded' (never 'error') because app is running.
    """
    db_connected = False
    db_error = None

    if AsyncSessionLocal is not None:
        try:
            async with AsyncSessionLocal() as session:
                await session.execute(text("SELECT 1"))
                db_connected = True
                registry.update_status(
                    "database",
                    IntegrationStatus.OPERATIONAL,
                    notes="PostgreSQL database connected and responding to query.",
                )
        except Exception as e:
            db_error = str(e)
            registry.update_status(
                "database",
                IntegrationStatus.DEGRADED,
                notes=f"Database probe failed: {db_error}",
            )
    else:
        registry.update_status(
            "database",
            IntegrationStatus.UNAVAILABLE,
            notes="DATABASE_URL not configured.",
        )

    # Check Gemini status
    if settings.is_ai_configured:
        registry.update_status(
            "gemini",
            IntegrationStatus.CONFIGURED,
            notes="Gemini API credentials loaded.",
        )
    else:
        registry.update_status(
            "gemini",
            IntegrationStatus.UNAVAILABLE,
            notes="GEMINI_API_KEY missing from environment.",
        )

    overall_status = "ok" if db_connected else "degraded"

    return {
        "status": overall_status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database_connected": db_connected,
        "database_error": db_error,
        "integrations": registry.to_dict(),
    }
