from typing import Any, Optional
from fastapi import APIRouter, Query
from app.services.pmjay.service import PMJAYSchemeInfo, PMJAYService

router = APIRouter(prefix="/pmjay", tags=["PM-JAY Scheme"])


@router.get("/info", response_model=PMJAYSchemeInfo)
async def get_pmjay_info():
    """Return verified statutory information on Ayushman Bharat PM-JAY."""
    return PMJAYService.get_scheme_info()


@router.get("/empanelled-hospitals")
async def get_empanelled_hospitals(
    state: Optional[str] = Query(None, description="State / UT name"),
    district: Optional[str] = Query(None, description="District name"),
):
    """Retrieve empanelled hospital directory status.
    Directs users to official GIS hospital finder.
    """
    return await PMJAYService.get_empanelled_hospitals(state=state, district=district)
