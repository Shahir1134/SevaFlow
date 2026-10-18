import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_and_get_profile(client: AsyncClient, auth_headers: dict[str, str]):
    payload = {
        "name": "Sharma Family",
        "primary_contact_phone": "+919876543210",
        "city": "Bengaluru",
        "state": "Karnataka",
        "pin_code": "560001",
        "members": [
            {
                "name": "Rohit Sharma",
                "relationship": "self",
                "date_of_birth": "1988-04-30",
                "gender": "male",
                "blood_group": "B+",
                "pre_existing_conditions": ["Hypertension"],
            }
        ],
    }

    create_res = await client.post("/profiles", json=payload, headers=auth_headers)
    assert create_res.status_code == 201
    data = create_res.json()
    assert data["name"] == "Sharma Family"
    assert data["city"] == "Bengaluru"
    assert len(data["members"]) == 1
    assert data["members"][0]["name"] == "Rohit Sharma"
    profile_id = data["id"]

    # Fetch profile
    get_res = await client.get(f"/profiles/{profile_id}", headers=auth_headers)
    assert get_res.status_code == 200
    assert get_res.json()["id"] == profile_id


@pytest.mark.asyncio
async def test_add_member_to_profile(client: AsyncClient, auth_headers: dict[str, str]):
    # Create profile
    profile_payload = {
        "name": "Verma Household",
        "city": "Delhi",
        "members": [],
    }
    p_res = await client.post("/profiles", json=profile_payload, headers=auth_headers)
    profile_id = p_res.json()["id"]

    # Add member
    member_payload = {
        "name": "Aarav Verma",
        "relationship": "child",
        "date_of_birth": "2018-09-15",
        "gender": "male",
        "blood_group": "O+",
        "pre_existing_conditions": [],
    }
    m_res = await client.post(
        f"/profiles/{profile_id}/members", json=member_payload, headers=auth_headers
    )
    assert m_res.status_code == 201
    m_data = m_res.json()
    assert m_data["name"] == "Aarav Verma"
    assert m_data["relationship"] == "child"

    # List members
    list_res = await client.get(f"/profiles/{profile_id}/members", headers=auth_headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) == 1


@pytest.mark.asyncio
async def test_user_profile_data_isolation(
    client: AsyncClient,
    auth_headers: dict[str, str],
    second_auth_headers: dict[str, str],
):
    # User 1 creates profile
    payload_u1 = {
        "name": "User 1 Private Family",
        "city": "Mumbai",
        "members": [],
    }
    res_u1 = await client.post("/profiles", json=payload_u1, headers=auth_headers)
    assert res_u1.status_code == 201
    profile_u1_id = res_u1.json()["id"]

    # User 2 listing profiles should NOT see User 1's profile
    res_u2_list = await client.get("/profiles", headers=second_auth_headers)
    assert res_u2_list.status_code == 200
    u2_profile_ids = [p["id"] for p in res_u2_list.json()]
    assert profile_u1_id not in u2_profile_ids

    # User 2 attempting direct GET of User 1's profile should receive 404
    res_u2_get = await client.get(
        f"/profiles/{profile_u1_id}", headers=second_auth_headers
    )
    assert res_u2_get.status_code == 404
