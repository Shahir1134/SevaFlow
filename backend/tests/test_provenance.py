from datetime import datetime, timezone
import pytest
from pydantic import ValidationError
from app.provenance.models import ProvenanceRecord, SourceType
from app.provenance.tracker import create_provenance_record, get_official_pmjay_provenance


def test_provenance_record_creation():
    rec = create_provenance_record(
        source_type=SourceType.OFFICIAL_PORTAL,
        source_name="National Health Authority Portal",
        source_url="https://pmjay.gov.in",
        verification_status="verified",
        notes="Verified from statutory central registry",
    )
    assert rec.source_type == SourceType.OFFICIAL_PORTAL
    assert rec.source_name == "National Health Authority Portal"
    assert rec.source_url == "https://pmjay.gov.in"
    assert rec.verification_status == "verified"
    assert isinstance(rec.retrieval_date, datetime)


def test_provenance_unknown_fields_remain_unknown():
    # If source_url or confidence_score or notes are not known, they MUST remain None
    rec = create_provenance_record(
        source_type=SourceType.POLICY_DOCUMENT,
        source_name="Star Health Policy Schedule",
    )
    assert rec.source_url is None
    assert rec.confidence_score is None
    assert rec.notes is None
    assert rec.verification_status == "unverified"


def test_provenance_immutability():
    rec = create_provenance_record(
        source_type=SourceType.REGULATORY_GUIDELINE,
        source_name="IRDAI Health Regulations",
    )
    with pytest.raises(ValidationError):
        # ProvenanceRecord is frozen and immutable
        rec.source_name = "Modified Source"


def test_official_pmjay_provenance():
    rec = get_official_pmjay_provenance()
    assert rec.source_type == SourceType.OFFICIAL_PORTAL
    assert rec.source_name == "NHA PM-JAY Official Website"
    assert rec.source_url == "https://pmjay.gov.in"
    assert rec.verification_status == "verified"
    assert rec.confidence_score == 1.0
