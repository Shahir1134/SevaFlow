import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_user, get_optional_current_user
from app.models.user import User
from app.schemas.claim import ClaimCreate, ClaimRead, ExpenseCreate, ExpenseRead, Section80DSummary
from app.services.claims.service import ClaimsService

router = APIRouter(prefix="/claims", tags=["Claims & Medical Expenses"])


@router.post("", response_model=ClaimRead, status_code=status.HTTP_201_CREATED)
async def create_claim(
    payload: ClaimCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ClaimsService.create_claim(payload=payload, user=current_user, db=db)


@router.get("", response_model=list[ClaimRead])
async def list_claims(
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user:
        return []
    return await ClaimsService.list_claims(user=current_user, db=db)


@router.get("/tax-deduction-80d")
@router.get("/section-80d-summary")
async def get_tax_deduction_80d(
    is_senior_citizen: bool = Query(
        False, description="Whether self or family member covered is age 60 or above"
    ),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user:
        return {
            "financialYear": "2025-26",
            "selfFamilyEligibleInr": 0,
            "selfFamilyMaxLimitInr": 25000,
            "parentsEligibleInr": 0,
            "parentsMaxLimitInr": 50000,
            "preventiveCheckupClaimedInr": 0,
            "preventiveCheckupMaxLimitInr": 5000,
            "totalDeductionInr": 0,
            "maxAllowedTotalInr": 75000,
            "breakdown": [
                {
                    "category": "Self & Dependent Family Health Insurance",
                    "forWho": "Self, Spouse, Children",
                    "amount": 0,
                    "cappedAmount": 0,
                },
                {
                    "category": "Parents Health Insurance & Medical",
                    "forWho": "Parents (Senior Citizen slab up to ₹50,000)",
                    "amount": 0,
                    "cappedAmount": 0,
                },
                {
                    "category": "Preventive Health Check-up (sub-limit)",
                    "forWho": "Family & Parents combined",
                    "amount": 0,
                    "cappedAmount": 0,
                },
            ],
        }

    summary = await ClaimsService.calculate_section_80d_summary(
        user=current_user, db=db, is_senior_citizen=is_senior_citizen
    )
    return {
        "financialYear": summary.financial_year,
        "selfFamilyEligibleInr": float(summary.eligible_insurance_and_medical_deduction),
        "selfFamilyMaxLimitInr": 25000,
        "parentsEligibleInr": 0,
        "parentsMaxLimitInr": 50000,
        "preventiveCheckupClaimedInr": float(summary.total_health_checkup_expenses),
        "preventiveCheckupMaxLimitInr": float(summary.eligible_checkup_deduction),
        "totalDeductionInr": float(summary.total_allowable_80d_deduction),
        "maxAllowedTotalInr": float(summary.max_allowable_limit),
        "breakdown": [
            {
                "category": "Self & Dependent Family Health Insurance",
                "forWho": "Self, Spouse, Children",
                "amount": float(summary.eligible_insurance_and_medical_deduction),
                "cappedAmount": float(summary.eligible_insurance_and_medical_deduction),
            },
            {
                "category": "Parents Health Insurance & Medical",
                "forWho": "Parents (Senior Citizen slab up to ₹50,000)",
                "amount": 0,
                "cappedAmount": 0,
            },
            {
                "category": "Preventive Health Check-up (sub-limit)",
                "forWho": "Family & Parents combined",
                "amount": float(summary.total_health_checkup_expenses),
                "cappedAmount": float(summary.eligible_checkup_deduction),
            },
        ],
    }


@router.get("/{claim_id}", response_model=ClaimRead)
async def get_claim(
    claim_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    claim = await ClaimsService.get_claim(claim_id=claim_id, user=current_user, db=db)
    if not claim:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Claim not found.")
    return claim


@router.post("/{claim_id}/expenses", response_model=ExpenseRead, status_code=status.HTTP_201_CREATED)
async def add_expense_to_claim(
    claim_id: uuid.UUID,
    payload: ExpenseCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ClaimsService.add_expense(
        claim_id=claim_id, payload=payload, user=current_user, db=db
    )
