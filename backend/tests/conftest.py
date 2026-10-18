import os
import sys
import uuid
from collections.abc import AsyncGenerator
from datetime import datetime, timezone
from pathlib import Path

# Ensure backend root is on sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from app.config import get_settings
from app.database import Base, get_db
from app.dependencies import create_access_token, hash_password
from app.main import app
from app.models.user import User

# In-memory SQLite for non-integration tests
TEST_DB_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
)

TestSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


def pytest_collection_modifyitems(config, items):
    settings = get_settings()

    # Skip gemini tests if key is missing
    has_gemini = bool(settings.gemini_api_key and settings.gemini_api_key.strip())
    # Skip nha tests if key is missing
    has_nha = bool(settings.nha_pmjay_api_key and settings.nha_pmjay_api_key.strip())
    # Real PostgreSQL presence
    has_pg = bool(settings.database_url and "postgresql" in settings.database_url)

    skip_gemini = pytest.mark.skip(reason="BLOCKED: GEMINI_API_KEY required")
    skip_nha = pytest.mark.skip(reason="BLOCKED: NHA API authorisation required")
    skip_pg = pytest.mark.skip(reason="BLOCKED: PostgreSQL required")

    for item in items:
        if "gemini" in item.keywords and not has_gemini:
            item.add_marker(skip_gemini)
        if "nha" in item.keywords and not has_nha:
            item.add_marker(skip_nha)
        if "integration" in item.keywords and not has_pg:
            item.add_marker(skip_pg)


@pytest_asyncio.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestSessionLocal() as session:
        yield session

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest_asyncio.fixture(scope="function")
async def test_user(db_session: AsyncSession) -> User:
    user = User(
        id=uuid.uuid4(),
        email="rajesh.kumar@example.com",
        hashed_password=hash_password("Password@123"),
        full_name="Rajesh Kumar",
        phone_number="+919876543210",
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture(scope="function")
async def auth_headers(test_user: User) -> dict[str, str]:
    token = create_access_token({"sub": str(test_user.id), "email": test_user.email})
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture(scope="function")
async def second_user(db_session: AsyncSession) -> User:
    user = User(
        id=uuid.uuid4(),
        email="anita.sharma@example.com",
        hashed_password=hash_password("Password@456"),
        full_name="Anita Sharma",
        phone_number="+919876543211",
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture(scope="function")
async def second_auth_headers(second_user: User) -> dict[str, str]:
    token = create_access_token({"sub": str(second_user.id), "email": second_user.email})
    return {"Authorization": f"Bearer {token}"}
