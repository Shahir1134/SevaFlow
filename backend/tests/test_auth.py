import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_success(client: AsyncClient):
    payload = {
        "email": "sunil.verma@example.com",
        "password": "StrongPassword123",
        "full_name": "Sunil Verma",
        "phone_number": "+919123456789",
    }
    response = await client.post("/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert data["expires_in"] > 0


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    payload = {
        "email": "duplicate@example.com",
        "password": "StrongPassword123",
        "full_name": "First User",
    }
    res1 = await client.post("/auth/register", json=payload)
    assert res1.status_code == 201

    res2 = await client.post("/auth/register", json=payload)
    assert res2.status_code == 400
    assert "already exists" in res2.json()["detail"]


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    # Register first
    reg_payload = {
        "email": "priya.nair@example.com",
        "password": "SecurePassword456",
        "full_name": "Priya Nair",
    }
    await client.post("/auth/register", json=reg_payload)

    # Login
    login_payload = {
        "email": "priya.nair@example.com",
        "password": "SecurePassword456",
    }
    response = await client.post("/auth/login", json=login_payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data


@pytest.mark.asyncio
async def test_login_invalid_credentials(client: AsyncClient):
    login_payload = {
        "email": "nonexistent@example.com",
        "password": "WrongPassword",
    }
    response = await client.post("/auth/login", json=login_payload)
    assert response.status_code == 401
    assert "Incorrect email or password" in response.json()["detail"]


@pytest.mark.asyncio
async def test_refresh_token_rotation(client: AsyncClient):
    reg_payload = {
        "email": "vikram.singh@example.com",
        "password": "Password789!",
        "full_name": "Vikram Singh",
    }
    reg_res = await client.post("/auth/register", json=reg_payload)
    tokens = reg_res.json()
    original_refresh = tokens["refresh_token"]

    # Refresh
    refresh_res = await client.post(
        "/auth/refresh", json={"refresh_token": original_refresh}
    )
    assert refresh_res.status_code == 200
    new_tokens = refresh_res.json()
    assert "access_token" in new_tokens
    assert "refresh_token" in new_tokens
    assert new_tokens["refresh_token"] != original_refresh

    # Using the old refresh token should now fail
    old_res = await client.post(
        "/auth/refresh", json={"refresh_token": original_refresh}
    )
    assert old_res.status_code == 401


@pytest.mark.asyncio
async def test_logout(client: AsyncClient):
    reg_payload = {
        "email": "manish.tiwari@example.com",
        "password": "Password1234!",
        "full_name": "Manish Tiwari",
    }
    reg_res = await client.post("/auth/register", json=reg_payload)
    tokens = reg_res.json()
    access_token = tokens["access_token"]
    refresh_token = tokens["refresh_token"]

    headers = {"Authorization": f"Bearer {access_token}"}
    logout_res = await client.post(
        "/auth/logout", json={"refresh_token": refresh_token}, headers=headers
    )
    assert logout_res.status_code == 200
    assert logout_res.json()["message"] == "Logged out successfully."

    # Refresh token should now be rejected
    refresh_res = await client.post(
        "/auth/refresh", json={"refresh_token": refresh_token}
    )
    assert refresh_res.status_code == 401
