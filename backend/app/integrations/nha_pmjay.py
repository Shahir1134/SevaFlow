import logging
from typing import Any, Optional
from app.config import get_settings
from app.integrations.registry import IntegrationStatus, registry

logger = logging.getLogger(__name__)


class NHAPMJAYClient:
    """Adapter for National Health Authority (NHA) Ayushman Bharat PM-JAY integration.
    Per regulatory rules, live beneficiary verification requires official governmental MoU/B2B clearance.
    When not authorized, this adapter explicitly returns REQUIRES_AUTHORISATION.
    """

    def __init__(self) -> None:
        self.settings = get_settings()

    def get_status(self) -> IntegrationStatus:
        return registry.get_status("nha_pmjay")

    async def verify_beneficiary(self, beneficiary_id: str) -> dict[str, Any]:
        """Verification is unavailable without official NHA B2B credentials.
        NEVER claim eligibility or ineligibility without authorized access.
        """
        return {
            "status": "UNAVAILABLE",
            "integration_status": self.get_status().value,
            "beneficiary_id": beneficiary_id,
            "verified": False,
            "message": (
                "Official beneficiary verification requires government NHA authorization. "
                "Please verify directly via the official PM-JAY portal or call the official helpline 14555."
            ),
            "official_portal": "https://pmjay.gov.in",
            "helpline": "14555",
        }

    async def search_empanelled_hospitals(
        self, state: Optional[str] = None, district: Optional[str] = None
    ) -> dict[str, Any]:
        """Empanelled hospital lookup returns DATA_UNAVAILABLE and directs to the official portal."""
        return {
            "status": "DATA_UNAVAILABLE",
            "integration_status": self.get_status().value,
            "hospitals": [],
            "message": (
                "Empanelled hospital registry requires live authorized synchronization with NHA. "
                "Please use the official government portal to search empanelled hospitals."
            ),
            "official_url": "https://hospitals.pmjay.gov.in",
        }


nha_client = NHAPMJAYClient()
