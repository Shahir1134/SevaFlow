import logging
import uuid
from decimal import Decimal
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.claim import Claim, Expense
from app.models.user import User
from app.schemas.claim import (
    ClaimCreate,
    ClaimRead,
    ClaimUpdate,
    ExpenseCreate,
    ExpenseRead,
    Section80DSummary,
)

logger = logging.getLogger(__name__)


class ClaimsService:
    @staticmethod
    async def create_claim(
        payload: ClaimCreate, user: User, db: AsyncSession
    ) -> ClaimRead:
        claim = Claim(
            id=uuid.uuid4(),
            user_id=user.id,
            policy_id=payload.policy_id,
            member_id=payload.member_id,
            claim_number=payload.claim_number,
            title=payload.title,
            hospital_name=payload.hospital_name,
            admission_date=payload.admission_date,
            discharge_date=payload.discharge_date,
            total_amount=Decimal("0.00"),
            claimed_amount=Decimal("0.00"),
            status="draft",
            notes=payload.notes,
        )
        db.add(claim)
        await db.flush()

        total = Decimal("0.00")
        expenses_read: list[ExpenseRead] = []

        for exp in payload.expenses:
            exp_model = Expense(
                id=uuid.uuid4(),
                claim_id=claim.id,
                user_id=user.id,
                category=exp.category,
                amount=exp.amount,
                expense_date=exp.expense_date,
                description=exp.description,
                is_tax_exempt_80d=exp.is_tax_exempt_80d,
                receipt_id=exp.receipt_id,
            )
            db.add(exp_model)
            total += exp.amount
            expenses_read.append(
                ExpenseRead(
                    id=exp_model.id,
                    claim_id=exp_model.claim_id,
                    user_id=exp_model.user_id,
                    category=exp_model.category,
                    amount=exp_model.amount,
                    expense_date=exp_model.expense_date,
                    description=exp_model.description,
                    is_tax_exempt_80d=exp_model.is_tax_exempt_80d,
                    receipt_id=exp_model.receipt_id,
                    created_at=exp_model.created_at or exp_model.expense_date,
                )
            )

        claim.total_amount = total
        claim.claimed_amount = total
        await db.commit()
        await db.refresh(claim)

        return ClaimRead(
            id=claim.id,
            user_id=claim.user_id,
            policy_id=claim.policy_id,
            member_id=claim.member_id,
            claim_number=claim.claim_number,
            title=claim.title,
            hospital_name=claim.hospital_name,
            admission_date=claim.admission_date,
            discharge_date=claim.discharge_date,
            total_amount=claim.total_amount,
            claimed_amount=claim.claimed_amount,
            approved_amount=claim.approved_amount,
            status=claim.status,
            notes=claim.notes,
            created_at=claim.created_at,
            expenses=expenses_read,
        )

    @staticmethod
    async def list_claims(user: User, db: AsyncSession) -> list[ClaimRead]:
        stmt = (
            select(Claim)
            .where(Claim.user_id == user.id, Claim.deleted_at.is_(None))
            .order_by(Claim.created_at.desc())
        )
        res = await db.execute(stmt)
        claims = res.scalars().all()

        results: list[ClaimRead] = []
        for c in claims:
            exp_stmt = select(Expense).where(
                Expense.claim_id == c.id, Expense.deleted_at.is_(None)
            )
            exp_res = await db.execute(exp_stmt)
            expenses = exp_res.scalars().all()
            results.append(
                ClaimRead(
                    id=c.id,
                    user_id=c.user_id,
                    policy_id=c.policy_id,
                    member_id=c.member_id,
                    claim_number=c.claim_number,
                    title=c.title,
                    hospital_name=c.hospital_name,
                    admission_date=c.admission_date,
                    discharge_date=c.discharge_date,
                    total_amount=c.total_amount,
                    claimed_amount=c.claimed_amount,
                    approved_amount=c.approved_amount,
                    status=c.status,
                    notes=c.notes,
                    created_at=c.created_at,
                    expenses=[
                        ExpenseRead(
                            id=e.id,
                            claim_id=e.claim_id,
                            user_id=e.user_id,
                            category=e.category,
                            amount=e.amount,
                            expense_date=e.expense_date,
                            description=e.description,
                            is_tax_exempt_80d=e.is_tax_exempt_80d,
                            receipt_id=e.receipt_id,
                            created_at=e.created_at,
                        )
                        for e in expenses
                    ],
                )
            )
        return results

    @staticmethod
    async def get_claim(
        claim_id: uuid.UUID, user: User, db: AsyncSession
    ) -> Optional[ClaimRead]:
        stmt = select(Claim).where(
            Claim.id == claim_id,
            Claim.user_id == user.id,
            Claim.deleted_at.is_(None),
        )
        res = await db.execute(stmt)
        c = res.scalar_one_or_none()
        if not c:
            return None

        exp_stmt = select(Expense).where(
            Expense.claim_id == c.id, Expense.deleted_at.is_(None)
        )
        exp_res = await db.execute(exp_stmt)
        expenses = exp_res.scalars().all()

        return ClaimRead(
            id=c.id,
            user_id=c.user_id,
            policy_id=c.policy_id,
            member_id=c.member_id,
            claim_number=c.claim_number,
            title=c.title,
            hospital_name=c.hospital_name,
            admission_date=c.admission_date,
            discharge_date=c.discharge_date,
            total_amount=c.total_amount,
            claimed_amount=c.claimed_amount,
            approved_amount=c.approved_amount,
            status=c.status,
            notes=c.notes,
            created_at=c.created_at,
            expenses=[
                ExpenseRead(
                    id=e.id,
                    claim_id=e.claim_id,
                    user_id=e.user_id,
                    category=e.category,
                    amount=e.amount,
                    expense_date=e.expense_date,
                    description=e.description,
                    is_tax_exempt_80d=e.is_tax_exempt_80d,
                    receipt_id=e.receipt_id,
                    created_at=e.created_at,
                )
                for e in expenses
            ],
        )

    @staticmethod
    async def add_expense(
        claim_id: uuid.UUID, payload: ExpenseCreate, user: User, db: AsyncSession
    ) -> ExpenseRead:
        stmt = select(Claim).where(
            Claim.id == claim_id,
            Claim.user_id == user.id,
            Claim.deleted_at.is_(None),
        )
        res = await db.execute(stmt)
        claim = res.scalar_one_or_none()
        if not claim:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Claim not found.")

        exp = Expense(
            id=uuid.uuid4(),
            claim_id=claim.id,
            user_id=user.id,
            category=payload.category,
            amount=payload.amount,
            expense_date=payload.expense_date,
            description=payload.description,
            is_tax_exempt_80d=payload.is_tax_exempt_80d,
            receipt_id=payload.receipt_id,
        )
        db.add(exp)

        # Update claim totals deterministically
        claim.total_amount += payload.amount
        claim.claimed_amount += payload.amount

        await db.commit()
        await db.refresh(exp)

        return ExpenseRead(
            id=exp.id,
            claim_id=exp.claim_id,
            user_id=exp.user_id,
            category=exp.category,
            amount=exp.amount,
            expense_date=exp.expense_date,
            description=exp.description,
            is_tax_exempt_80d=exp.is_tax_exempt_80d,
            receipt_id=exp.receipt_id,
            created_at=exp.created_at,
        )

    @staticmethod
    async def calculate_section_80d_summary(
        user: User, db: AsyncSession, is_senior_citizen: bool = False
    ) -> Section80DSummary:
        """Deterministic computation of Section 80D tax deduction based on Indian Income Tax Act.
        - Preventive health check-up deduction is capped at ₹5,000.
        - Overall limit is ₹25,000 for regular individuals, or ₹50,000 for senior citizens.
        - Preventive checkup is within the overall limit, not additional.
        NEVER uses AI-generated amounts.
        """
        stmt = select(Expense).where(
            Expense.user_id == user.id,
            Expense.deleted_at.is_(None),
            Expense.is_tax_exempt_80d.is_(True),
        )
        res = await db.execute(stmt)
        expenses = res.scalars().all()

        total_medical = Decimal("0.00")
        total_checkup = Decimal("0.00")

        for e in expenses:
            if e.category == "preventive_checkup":
                total_checkup += e.amount
            else:
                total_medical += e.amount

        max_limit = Decimal("50000.00") if is_senior_citizen else Decimal("25000.00")
        checkup_cap = Decimal("5000.00")

        # Cap preventive health check-up at ₹5,000
        eligible_checkup = min(total_checkup, checkup_cap)

        # Medical expenses eligible
        eligible_medical = total_medical

        # Overall allowable is capped at max_limit
        combined_total = eligible_checkup + eligible_medical
        total_allowable = min(combined_total, max_limit)

        return Section80DSummary(
            financial_year="2024-2025",
            total_medical_expenses=total_medical,
            total_health_checkup_expenses=total_checkup,
            eligible_checkup_deduction=eligible_checkup,
            eligible_insurance_and_medical_deduction=eligible_medical,
            max_allowable_limit=max_limit,
            total_allowable_80d_deduction=total_allowable,
            disclaimer=(
                "Section 80D summary is a deterministic calculation under standard Income Tax Act provisions. "
                "Consult a certified Chartered Accountant (CA) or tax advisor for filing eligibility and documentation."
            ),
        )
