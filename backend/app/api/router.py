from fastapi import APIRouter
from app.api.auth import router as auth_router
from app.api.claims import router as claims_router
from app.api.documents import router as documents_router
from app.api.find_care import router as find_care_router
from app.api.health import router as health_router
from app.api.insurance import router as insurance_router
from app.api.medications import router as medications_router
from app.api.onboarding import router as onboarding_router
from app.api.pmjay import router as pmjay_router
from app.api.profiles import router as profiles_router

api_router = APIRouter()

# Mount all endpoint routers
api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(profiles_router)
api_router.include_router(documents_router)
api_router.include_router(insurance_router)
api_router.include_router(find_care_router, prefix="/find-care")
api_router.include_router(find_care_router, prefix="/care")
api_router.include_router(pmjay_router)
api_router.include_router(medications_router)
api_router.include_router(claims_router)
api_router.include_router(onboarding_router)

__all__ = ["api_router"]
