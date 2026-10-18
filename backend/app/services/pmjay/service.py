import logging
from typing import Any, Optional
from pydantic import BaseModel, Field
from app.integrations.nha_pmjay import nha_client
from app.provenance.models import SourceType
from app.provenance.tracker import PMJAY_BASELINE_DATE, create_provenance_record, get_official_pmjay_provenance

logger = logging.getLogger(__name__)


class PMJAYSchemeInfo(BaseModel):
    scheme_name: str = "Ayushman Bharat Pradhan Mantri Jan Arogya Yojana (AB PM-JAY)"
    governing_body: str = "National Health Authority (NHA), Ministry of Health & Family Welfare"
    benefit_amount: str = "₹5,00,000 per family per year"
    benefit_amount_inr: int = 500000
    coverage_scope: str = "Secondary and tertiary care hospitalization across public and empaneled private hospitals"
    eligibility_basis: str = (
        "Based on Socio-Economic Caste Census (SECC 2011) deprivation criteria for rural areas "
        "and occupational criteria for urban areas. No cap on family size, age, or gender."
    )
    official_helpline: str = "14555"
    official_toll_free: str = "1800-111-565"
    official_website: str = "https://pmjay.gov.in"
    hospital_search_portal: str = "https://hospitals.pmjay.gov.in"
    card_download_portal: str = "https://beneficiary.nha.gov.in"
    provenance: dict[str, Any]


class PMJAYService:
    @staticmethod
    def get_scheme_info() -> PMJAYSchemeInfo:
        """Return statutory, verified PM-JAY scheme information.
        Provenance is anchored to official National Health Authority sources.
        """
        provenance = get_official_pmjay_provenance()
        return PMJAYSchemeInfo(
            provenance=provenance.model_dump(),
        )

    @staticmethod
    async def verify_beneficiary(identifier: str) -> dict[str, Any]:
        """Verify beneficiary eligibility.
        Always returns UNAVAILABLE without authorized NHA clearance.
        NEVER claims eligibility or ineligibility without live official verification.
        """
        return await nha_client.verify_beneficiary(identifier)

    @staticmethod
    async def get_empanelled_hospitals(
        state: Optional[str] = None, district: Optional[str] = None
    ) -> dict[str, Any]:
        """Hospital empanelment list returns DATA_UNAVAILABLE and directs to official portal."""
        res = await nha_client.search_empanelled_hospitals(state=state, district=district)
        provenance = create_provenance_record(
            source_type=SourceType.OFFICIAL_PORTAL,
            source_name="NHA Hospital Finder",
            source_url="https://hospitals.pmjay.gov.in",
            retrieval_date=PMJAY_BASELINE_DATE,
            verification_status="verified",
            notes="Empanelled facilities must be verified on official government GIS portal.",
        )
        res["provenance"] = provenance.model_dump()
        return res
