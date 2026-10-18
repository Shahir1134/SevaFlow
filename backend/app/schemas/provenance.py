import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.provenance.models import SourceType


class ProvenanceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: Optional[uuid.UUID] = None
    source_type: SourceType
    source_name: str
    source_url: Optional[str] = None
    retrieval_date: datetime
    confidence_score: Optional[float] = None
    verification_status: str
    notes: Optional[str] = None


__all__ = ["SourceType", "ProvenanceRead"]
