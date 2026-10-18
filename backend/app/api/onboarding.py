from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.profile import ProfileCreate, ProfileRead
from app.services.onboarding.service import OnboardingService

router = APIRouter(prefix="/onboarding", tags=["Onboarding"])


@router.post("/complete", response_model=ProfileRead, status_code=status.HTTP_201_CREATED)
async def complete_onboarding(
    payload: ProfileCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Complete user onboarding: persist family profile and initial family members."""
    return await OnboardingService.complete_onboarding(
        payload=payload, user=current_user, db=db
    )
