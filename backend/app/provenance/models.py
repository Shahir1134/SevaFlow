from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class SourceType(str, Enum):
    OFFICIAL_PORTAL = "official_portal"
    POLICY_DOCUMENT = "policy_document"
    USER_INPUT = "user_input"
    REGULATORY_GUIDELINE = "regulatory_guideline"
    CALCULATION = "calculation"
    VERIFIED_REGISTRY = "verified_registry"
    UNVERIFIED_DATA = "unverified_data"


class ProvenanceRecord(BaseModel):
    """Immutable data record tracking origin, verification status, and audit trail.
    Unknown or missing fields MUST remain None/unknown and never be fabricated.
    """
    model_config = ConfigDict(frozen=True)

    source_type: SourceType
    source_name: str
    source_url: Optional[str] = None
    retrieval_date: datetime
    confidence_score: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    verification_status: str = Field(default="unverified", description="verified | unverified | blocked")
    notes: Optional[str] = None
