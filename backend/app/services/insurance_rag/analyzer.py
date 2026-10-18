import json
import logging
import re
import uuid
from decimal import Decimal
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.integrations.gemini import gemini_client
from app.schemas.insurance import CoverageResponse, SourceReference
from app.services.insurance_rag.retrieval import retrieve_relevant_clauses
from app.services.insurance_rag.verifier import verify_quote

logger = logging.getLogger(__name__)


async def analyze_coverage(
    question: str,
    document_id: Optional[uuid.UUID],
    db: AsyncSession,
) -> CoverageResponse:
    """Analyze policy coverage for a specific question using grounded RAG pipeline.
    All claims and quotes are programmatically verified against source document text.
    """
    if not document_id:
        return CoverageResponse(
            covered="unclear",
            amount=None,
            currency="INR",
            calculation_basis=None,
            clause_id=None,
            exact_quote=None,
            source_document_id=None,
            page_number=None,
            evidence=[],
            limitations=["No policy document was specified or uploaded."],
            confidence="insufficient_evidence",
            next_steps=[
                "Upload the official policy wording schedule (PDF) before querying coverage terms.",
                "Ensure policy schedule contains section-wise limits and exclusions.",
            ],
        )

    if not gemini_client.is_available:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="SERVICE_UNAVAILABLE: Gemini AI integration is not configured or offline. AI coverage analysis is unavailable.",
        )

    # Retrieve relevant clauses via vector search
    retrieved_chunks = await retrieve_relevant_clauses(
        query=question,
        document_id=document_id,
        db=db,
        top_k=5,
    )

    if not retrieved_chunks:
        return CoverageResponse(
            covered="unclear",
            amount=None,
            currency="INR",
            calculation_basis="No relevant policy clauses matched the search query.",
            clause_id=None,
            exact_quote=None,
            source_document_id=document_id,
            page_number=None,
            evidence=[],
            limitations=["No matching clauses located in the uploaded policy document."],
            confidence="insufficient_evidence",
            next_steps=[
                "Verify whether the uploaded document is the complete policy wordings or merely a certificate of insurance.",
                "Rephrase the clinical query using standard insurance terms (e.g., 'maternity sub-limit', 'cataract capping').",
            ],
        )

    # Build evidence list and prompt
    evidence_references: list[SourceReference] = []
    chunk_texts: list[str] = []
    combined_source_text: str = ""

    for chunk in retrieved_chunks:
        evidence_references.append(
            SourceReference(
                chunk_id=chunk.id,
                page_number=chunk.page_number,
                clause_text=chunk.source_text,
                verified=True,
            )
        )
        chunk_texts.append(f"[Page {chunk.page_number}]: {chunk.source_text}")
        combined_source_text += f" {chunk.source_text}"

    analysis_prompt = (
        f"You are a medical insurance analysis expert analyzing policy terms strictly against the evidence.\n"
        f"Question: {question}\n\n"
        f"Instructions:\n"
        f"1. Respond ONLY with a valid JSON object (no markdown code fences, no extra text).\n"
        f"2. Keys required:\n"
        f"   - covered: 'yes' | 'no' | 'unclear'\n"
        f"   - amount: number or null (e.g. 50000 or null)\n"
        f"   - calculation_basis: string explaining basis or null\n"
        f"   - clause_id: string identifying clause header/number or null\n"
        f"   - exact_quote: an EXACT verbatim quote from the evidence clauses or null\n"
        f"   - page_number: integer page number where quote was found, or null\n"
        f"   - limitations: list of strings listing copays, sub-limits, or waiting periods\n"
        f"   - confidence: 'high' | 'medium' | 'low' | 'insufficient_evidence'\n"
        f"   - next_steps: list of practical next action strings\n"
        f"3. NEVER fabricate quotes or amounts. If evidence is ambiguous, set covered='unclear'."
    )

    ai_response = await gemini_client.generate_grounded_response(
        prompt=analysis_prompt,
        evidence=chunk_texts,
    )

    if not ai_response:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="SERVICE_UNAVAILABLE: Gemini AI service failed to generate analysis.",
        )

    # Parse JSON from AI response
    cleaned_json = ai_response.strip()
    if cleaned_json.startswith("```"):
        cleaned_json = re.sub(r"^```(?:json)?", "", cleaned_json)
        cleaned_json = re.sub(r"```$", "", cleaned_json).strip()

    try:
        data = json.loads(cleaned_json)
    except Exception as e:
        logger.warning("Failed to parse JSON from AI response: %s. Response was: %s", str(e), ai_response)
        return CoverageResponse(
            covered="unclear",
            amount=None,
            currency="INR",
            calculation_basis="Analysis could not be formatted deterministically.",
            clause_id=None,
            exact_quote=None,
            source_document_id=document_id,
            page_number=retrieved_chunks[0].page_number if retrieved_chunks else None,
            evidence=evidence_references,
            limitations=["Raw response requires manual verification."],
            confidence="low",
            next_steps=["Consult your Third-Party Administrator (TPA) or insurer helpline directly."],
        )

    # Programmatic verification of exact_quote against source text
    exact_quote = data.get("exact_quote")
    quote_verified = False
    if exact_quote and isinstance(exact_quote, str) and exact_quote.strip():
        quote_verified = verify_quote(exact_quote, combined_source_text)
        if not quote_verified:
            logger.warning("AI suggested quote could not be verified against source text: '%s'", exact_quote)
            exact_quote = None  # Refuse to return unverified quote

    # Amount validation (Decimal conversion)
    raw_amount = data.get("amount")
    amount_dec: Optional[Decimal] = None
    if raw_amount is not None:
        try:
            amount_dec = Decimal(str(raw_amount))
        except Exception:
            amount_dec = None

    covered_status = data.get("covered", "unclear")
    if covered_status not in ("yes", "no", "unclear"):
        covered_status = "unclear"

    confidence_status = data.get("confidence", "insufficient_evidence")
    if not quote_verified and confidence_status == "high":
        confidence_status = "medium"

    page_num = data.get("page_number")
    if page_num is None and retrieved_chunks:
        page_num = retrieved_chunks[0].page_number

    limitations = data.get("limitations") if isinstance(data.get("limitations"), list) else []
    if not quote_verified and data.get("exact_quote"):
        limitations.append("Quote suggested by AI could not be verbatim verified against source text.")

    next_steps = data.get("next_steps") if isinstance(data.get("next_steps"), list) else [
        "Confirm cashless network status with hospital TPA helpdesk before admission."
    ]

    return CoverageResponse(
        covered=covered_status,
        amount=amount_dec,
        currency="INR",
        calculation_basis=data.get("calculation_basis"),
        clause_id=data.get("clause_id"),
        exact_quote=exact_quote,
        source_document_id=document_id,
        page_number=page_num,
        evidence=evidence_references,
        limitations=limitations,
        confidence=confidence_status,
        next_steps=next_steps,
    )
