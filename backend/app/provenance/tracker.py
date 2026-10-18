from datetime import datetime, timezone
from typing import Any, Optional
from app.provenance.models import ProvenanceRecord, SourceType

# Official PM-JAY baseline reference date fixed at build time
PMJAY_BASELINE_DATE = datetime(2025, 1, 1, 0, 0, 0, tzinfo=timezone.utc)


def create_provenance_record(
    source_type: SourceType,
    source_name: str,
    source_url: Optional[str] = None,
    retrieval_date: Optional[datetime] = None,
    confidence_score: Optional[float] = None,
    verification_status: str = "unverified",
    notes: Optional[str] = None,
) -> ProvenanceRecord:
    """Create a strictly validated provenance record.
    Missing or unconfirmed metadata fields are preserved as None.
    """
    return ProvenanceRecord(
        source_type=source_type,
        source_name=source_name,
        source_url=source_url,
        retrieval_date=retrieval_date or datetime.now(timezone.utc),
        confidence_score=confidence_score,
        verification_status=verification_status,
        notes=notes,
    )


def get_official_pmjay_provenance() -> ProvenanceRecord:
    """Return provenance metadata for official National Health Authority PM-JAY scheme info."""
    return create_provenance_record(
        source_type=SourceType.OFFICIAL_PORTAL,
        source_name="NHA PM-JAY Official Website",
        source_url="https://pmjay.gov.in",
        retrieval_date=PMJAY_BASELINE_DATE,
        confidence_score=1.0,
        verification_status="verified",
        notes="Official National Health Authority (NHA) statutory guidelines. Must be re-verified periodically.",
    )


def attach_provenance(payload: dict[str, Any], record: ProvenanceRecord) -> dict[str, Any]:
    """Attach provenance metadata dict to any outgoing payload."""
    payload["provenance"] = record.model_dump()
    return payload
