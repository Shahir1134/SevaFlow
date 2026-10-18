import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from app.api.router import api_router
from app.config import get_settings
from app.dependencies import limiter
from app.integrations.registry import IntegrationStatus, registry

logger = logging.getLogger(__name__)
settings = get_settings()

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    logger.info("Starting %s in %s mode...", settings.app_name, settings.app_env)
    # Log registry status
    for name, entry in registry.get_all().items():
        logger.info("Integration [%s]: Status=%s", name, entry.status.value)
    yield
    logger.info("Shutting down %s...", settings.app_name)


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        description="AI Healthcare Platform for Indian Families Backend API",
        version="0.1.0",
        lifespan=lifespan,
    )

    # Attach Rate Limiter
    app.state.limiter = limiter
    app.add_middleware(SlowAPIMiddleware)

    # CORS configuration
    allowed_origins = [settings.frontend_url]
    if settings.app_env == "development":
        allowed_origins.extend(["http://localhost:3000", "http://127.0.0.1:5173"])

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Mount API routes (supports both /api/* from frontend and direct /* endpoints)
    app.include_router(api_router, prefix="/api")
    app.include_router(api_router)

    # Rate limiting error handler
    @app.exception_handler(RateLimitExceeded)
    async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={
                "error": "Rate limit exceeded",
                "detail": "Too many requests. Please slow down and try again later.",
            },
        )

    # Validation error handler
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "error": "Validation error",
                "detail": exc.errors(),
            },
        )

    # HTTP exception handler
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": exc.detail if isinstance(exc.detail, str) else "HTTP error",
                "detail": exc.detail,
            },
            headers=exc.headers,
        )

    # Unhandled generic exception handler (Sanitized - no stack traces leaked)
    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        logger.exception("Unhandled server exception: %s", str(exc))
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": "Internal server error",
                "detail": "An unexpected error occurred. Please contact support if the problem persists.",
            },
        )

    return app


app = create_app()
