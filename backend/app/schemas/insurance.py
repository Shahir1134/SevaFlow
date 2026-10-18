import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Any, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field


class SourceReference(BaseModel):
    chunk_id: Optional[uuid.UUID] = None
    page_number: int
    clause_text: str
    verified: bool = False


class CoverageRequest(BaseModel):
    document_id: Optional[uuid.UUID] = None
    policy_id: Optional[uuid.UUID] = None
    question: str = Field(min_length=3, max_length=1000)


class CoverageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    covered: Literal["yes", "no", "unclear"]
    amount: Optional[Decimal] = None
    currency: str = "INR"
    calculation_basis: Optional[str] = None
    clause_id: Optional[str] = None
    exact_quote: Optional[str] = None
    source_document_id: Optional[uuid.UUID] = None
    page_number: Optional[int] = None
    evidence: list[SourceReference] = Field(default_factory=list)
    limitations: list[str] = Field(default_factory=list)
    confidence: Literal["high", "medium", "low", "insufficient_evidence"] = "insufficient_evidence"
    next_steps: list[str] = Field(default_factory=list)


class PolicyCreate(BaseModel):
    document_id: Optional[uuid.UUID] = None
    insurer_name: str = Field(min_length=1, max_length=255)
    policy_number: str = Field(min_length=1, max_length=100)
    policy_name: str = Field(min_length=1, max_length=255)
    sum_insured: Decimal = Field(gt=0)
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class PolicyRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    document_id: Optional[uuid.UUID] = None
    insurer_name: str
    policy_number: str
    policy_name: str
    sum_insured: Decimal
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    created_at: datetime


class CoverageQueryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    policy_id: Optional[uuid.UUID] = None
    query_text: str
    response_summary: Optional[str] = None
    created_at: datetime
    results: list[CoverageResponse] = Field(default_factory=list)


class PolicyCoverageQueryInput(BaseModel):
    documentId: Optional[str] = None
    document_id: Optional[str] = None
    policyId: Optional[str] = None
    queryText: str = Field(min_length=2)
    category: Optional[str] = None


class CoverageClauseMatchSchema(BaseModel):
    sectionTitle: str
    content: str
    pageNumber: Optional[int] = None
    confidence: float = 0.9
    covered: bool = True
    copayPercent: Optional[int] = None
    waitingPeriodMonths: Optional[int] = None
    sublimitAmountInr: Optional[int] = None


class PolicyCoverageResultSchema(BaseModel):
    query: str
    coveredStatus: Literal["COVERED", "NOT_COVERED", "CONDITIONAL", "INSUFFICIENT_DATA"]
    confidence: float
    explanation: str
    matchedClauses: list[CoverageClauseMatchSchema] = Field(default_factory=list)
    dataNotice: str
    provenance: dict[str, Any]
