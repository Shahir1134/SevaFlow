import logging
from collections.abc import AsyncGenerator
from typing import Optional
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase
from app.config import get_settings

logger = logging.getLogger(__name__)


class Base(DeclarativeBase):
    pass


settings = get_settings()

engine: Optional[AsyncEngine] = None
AsyncSessionLocal: Optional[async_sessionmaker[AsyncSession]] = None
_tables_initialized = False


def _get_engine(db_url: str) -> AsyncEngine:
    connect_args = {}
    if "sqlite" in db_url:
        connect_args["check_same_thread"] = False
    return create_async_engine(
        db_url,
        echo=False,
        future=True,
        connect_args=connect_args,
    )


# Configure initial engine
_primary_url = settings.database_url
if _primary_url and _primary_url.startswith("postgresql://"):
    _primary_url = _primary_url.replace("postgresql://", "postgresql+asyncpg://", 1)

if _primary_url:
    engine = _get_engine(_primary_url)
    AsyncSessionLocal = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )
else:
    # Default to local SQLite if no DB URL
    engine = _get_engine("sqlite+aiosqlite:///./healthdb.db")
    AsyncSessionLocal = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )


async def _ensure_tables_initialized(session_factory: async_sessionmaker[AsyncSession]):
    global _tables_initialized
    if _tables_initialized:
        return
    try:
        import app.models  # ensure models are loaded
        assert engine is not None
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            # Ensure SQLite schema has new columns if running on SQLite
            if "sqlite" in str(engine.url):
                for col, col_type in [
                    ("patient_name", "VARCHAR(255)"),
                    ("sha256_hash", "VARCHAR(64)"),
                    ("ai_summary", "TEXT"),
                    ("clinical_insights_json", "TEXT"),
                ]:
                    try:
                        await conn.execute(text(f"ALTER TABLE uploaded_documents ADD COLUMN {col} {col_type}"))
                    except Exception:
                        pass
        _tables_initialized = True
    except Exception as e:
        logger.warning("Tables initialization notice: %s", str(e))


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    global engine, AsyncSessionLocal, _tables_initialized

    if AsyncSessionLocal is None:
        engine = _get_engine("sqlite+aiosqlite:///./healthdb.db")
        AsyncSessionLocal = async_sessionmaker(
            bind=engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autocommit=False,
            autoflush=False,
        )

    # Try connecting to current session maker
    try:
        async with AsyncSessionLocal() as session:
            # Test connectivity
            await session.execute(text("SELECT 1"))
            await _ensure_tables_initialized(AsyncSessionLocal)
            try:
                yield session
            except Exception:
                await session.rollback()
                raise
            finally:
                await session.close()
    except (OSError, ConnectionRefusedError, Exception) as conn_err:
        # If PostgreSQL was configured but unreachable, gracefully fall back to local SQLite
        if "postgresql" in str(getattr(engine, "url", "")):
            logger.warning(
                "PostgreSQL connection refused (%s). Falling back to resilient local SQLite storage.",
                str(conn_err),
            )
            engine = _get_engine("sqlite+aiosqlite:///./healthdb.db")
            AsyncSessionLocal = async_sessionmaker(
                bind=engine,
                class_=AsyncSession,
                expire_on_commit=False,
                autocommit=False,
                autoflush=False,
            )
            _tables_initialized = False
            async with AsyncSessionLocal() as fallback_session:
                await _ensure_tables_initialized(AsyncSessionLocal)
                try:
                    yield fallback_session
                except Exception:
                    await fallback_session.rollback()
                    raise
                finally:
                    await fallback_session.close()
        else:
            raise
