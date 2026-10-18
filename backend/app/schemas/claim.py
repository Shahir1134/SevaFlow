import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class ExpenseCreate(BaseModel):
    category: str = Field(description="hospitalisation, pharmacy, consultation, diagnostic, preventive_checkup, other")
    amount: Decimal = Field(gt=0)
    expense_date: date
    description: Optional[str] = None
    is_tax_exempt_80d: bool = True
    receipt_id: Optional[uuid.UUID] = None


class ExpenseRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    claim_id: uuid.UUID
    user_id: uuid.UUID
    category: str
    amount: Decimal
    expense_date: date
    description: Optional[str] = None
    is_tax_exempt_80d: bool
    receipt_id: Optional[uuid.UUID] = None
    created_at: datetime


class ClaimCreate(BaseModel):
    policy_id: Optional[uuid.UUID] = None
    member_id: Optional[uuid.UUID] = None
    claim_number: Optional[str] = None
    title: str = Field(min_length=1, max_length=255)
    hospital_name: Optional[str] = None
    admission_date: Optional[date] = None
    discharge_date: Optional[date] = None
    notes: Optional[str] = None
    expenses: list[ExpenseCreate] = Field(default_factory=list)


class ClaimUpdate(BaseModel):
    title: Optional[str] = None
    claim_number: Optional[str] = None
    hospital_name: Optional[str] = None
    admission_date: Optional[date] = None
    discharge_date: Optional[date] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    approved_amount: Optional[Decimal] = None


class ClaimRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    policy_id: Optional[uuid.UUID] = None
    member_id: Optional[uuid.UUID] = None
    claim_number: Optional[str] = None
    title: str
    hospital_name: Optional[str] = None
    admission_date: Optional[date] = None
    discharge_date: Optional[date] = None
    total_amount: Decimal
    claimed_amount: Decimal
    approved_amount: Optional[Decimal] = None
    status: str
    notes: Optional[str] = None
    created_at: datetime
    expenses: list[ExpenseRead] = Field(default_factory=list)


class Section80DSummary(BaseModel):
    financial_year: str
    total_medical_expenses: Decimal
    total_health_checkup_expenses: Decimal
    eligible_checkup_deduction: Decimal  # capped at Rs 5,000
    eligible_insurance_and_medical_deduction: Decimal
    max_allowable_limit: Decimal  # Rs 25,000 (regular) or Rs 50,000 (senior)
    total_allowable_80d_deduction: Decimal
    disclaimer: str
