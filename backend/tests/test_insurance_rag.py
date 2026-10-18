import uuid
from decimal import Decimal
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.insurance import CoverageRequest
from app.services.insurance_rag.analyzer import analyze_coverage
from app.services.insurance_rag.verifier import normalize_text, verify_quote


def test_quote_verification_exact_and_normalized():
    source_text = (
        "Section 4.1: Cataract surgery is covered subject to a sub-limit of INR 40,000 per eye, "
        "with a mandatory waiting period of 24 months from the policy commencement date."
    )

    # Verbatim substring match
    assert verify_quote("Cataract surgery is covered subject to a sub-limit", source_text) is True

    # Punctuation and case variation
    assert verify_quote("cataract surgery is covered, subject to a sub limit", source_text) is True

    # Hallucinated or altered quote MUST fail
    assert verify_quote("Cataract surgery is covered up to INR 80,000 without waiting period", source_text) is False
    assert verify_quote("LASIK eye surgery is fully covered", source_text) is False
    assert verify_quote("", source_text) is False


def test_normalize_text():
    raw = "  Clause 3(a):\n\r\tMaternity   Expenses!  "
    norm = normalize_text(raw)
    assert norm == "clause 3 a maternity expenses"


@pytest.mark.asyncio
async def test_analyze_coverage_without_document(db_session: AsyncSession):
    # When no document is provided, returns unclear with insufficient_evidence
    res = await analyze_coverage(
        question="Is dental root canal covered?",
        document_id=None,
        db=db_session,
    )
    assert res.covered == "unclear"
    assert res.confidence == "insufficient_evidence"
    assert "No policy document" in res.limitations[0]


@pytest.mark.gemini
@pytest.mark.integration
@pytest.mark.asyncio
async def test_full_rag_pipeline_with_gemini(
    db_session: AsyncSession, client: AsyncClient, auth_headers: dict[str, str]
):
    """Full live integration test requiring real GEMINI_API_KEY and PostgreSQL."""
    payload = {
        "question": "What is the waiting period for pre-existing diseases?",
        "document_id": str(uuid.uuid4()),
    }
    response = await client.post("/insurance/analyze", json=payload, headers=auth_headers)
    assert response.status_code in (200, 503)
