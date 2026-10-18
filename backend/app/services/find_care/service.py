import logging
from decimal import Decimal
from typing import Any, Optional
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from app.integrations.registry import IntegrationStatus, registry
from app.provenance.models import SourceType
from app.provenance.tracker import create_provenance_record

logger = logging.getLogger(__name__)


class OfficialSource(BaseModel):
    name: str
    url: str
    description: Optional[str] = None


class ProviderItem(BaseModel):
    id: str
    name: str
    facility_type: str
    location: str
    estimated_cost: Optional[Decimal] = None
    empanelled_pmjay: bool = False
    source: str


class FindCareResponse(BaseModel):
    concern: str
    location: str
    budget_inr: Decimal
    data_status: str  # "AVAILABLE" | "UNAVAILABLE"
    message: str
    providers: list[ProviderItem] = Field(default_factory=list)
    official_sources: list[OfficialSource] = Field(default_factory=list)
    provenance: dict[str, Any]


class FindCareService:
    @staticmethod
    async def search_providers(
        concern: str,
        location: str,
        budget_inr: Decimal,
        db: AsyncSession,
    ) -> FindCareResponse:
        """Search healthcare providers within budget.
        Checks integration registry for verified hospital data source.
        If data is not available, returns honest UNAVAILABLE response with official portal references.
        NEVER returns fake or hallucinated providers.
        """
        nha_status = registry.get_status("nha_pmjay")
        logger.info("Searching providers: concern='%s', location='%s', nha_status=%s", concern, location, nha_status)

        # Standard official portals for care finding in India
        official_sources = [
            OfficialSource(
                name="NHA Hospital Finder (PM-JAY)",
                url="https://hospitals.pmjay.gov.in",
                description="Official National Health Authority portal for finding empanelled public and private hospitals across India.",
            ),
            OfficialSource(
                name="National Health Portal (NHP)",
                url="https://www.nhp.gov.in",
                description="Government of India gateway to authentic health information and facility directories.",
            ),
        ]

        provenance_rec = create_provenance_record(
            source_type=SourceType.OFFICIAL_PORTAL,
            source_name="National Health Authority Hospital Directory",
            source_url="https://hospitals.pmjay.gov.in",
            verification_status="verified",
            notes="Real-time provider search requires authorized state health agency feeds.",
        )

        # When integration is in REQUIRES_AUTHORISATION or UNAVAILABLE state
        return FindCareResponse(
            concern=concern,
            location=location,
            budget_inr=budget_inr,
            data_status="UNAVAILABLE",
            message=(
                "Provider data for this area is not currently available. "
                "Verified provider data must be loaded from an authorised source before search results can be shown."
            ),
            providers=[],
            official_sources=official_sources,
            provenance=provenance_rec.model_dump(),
        )
