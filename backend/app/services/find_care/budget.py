from decimal import Decimal, ROUND_HALF_UP
from enum import Enum
from typing import Optional
from pydantic import BaseModel


class BudgetCategory(str, Enum):
    WITHIN_BUDGET = "within_budget"
    STRETCH = "stretch"  # <= 20% over budget
    OVER_BUDGET = "over_budget"
    PRICE_UNAVAILABLE = "price_unavailable"


class BudgetMatchResult(BaseModel):
    category: BudgetCategory
    budget_inr: Decimal
    price_inr: Optional[Decimal] = None
    variance_amount: Optional[Decimal] = None
    percentage_over_budget: Optional[Decimal] = None
    is_acceptable: bool


def categorize_budget(
    budget_inr: Decimal, price_inr: Optional[Decimal]
) -> BudgetCategory:
    """Classify price against budget strictly using Python Decimal arithmetic.
    NEVER use float calculations for monetary figures.
    Boundary rules:
      - price <= budget: WITHIN_BUDGET
      - price <= budget * 1.20: STRETCH (<=20% over)
      - price > budget * 1.20: OVER_BUDGET
      - price is None or <= 0: PRICE_UNAVAILABLE
    """
    if price_inr is None or price_inr <= Decimal("0"):
        return BudgetCategory.PRICE_UNAVAILABLE

    if budget_inr <= Decimal("0"):
        return BudgetCategory.OVER_BUDGET

    if price_inr <= budget_inr:
        return BudgetCategory.WITHIN_BUDGET

    stretch_threshold = (budget_inr * Decimal("1.20")).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    )
    if price_inr <= stretch_threshold:
        return BudgetCategory.STRETCH

    return BudgetCategory.OVER_BUDGET


def evaluate_budget_match(
    budget_inr: Decimal, price_inr: Optional[Decimal]
) -> BudgetMatchResult:
    """Full deterministic budget match evaluation with precise variance."""
    category = categorize_budget(budget_inr, price_inr)

    if category == BudgetCategory.PRICE_UNAVAILABLE or price_inr is None:
        return BudgetMatchResult(
            category=category,
            budget_inr=budget_inr,
            price_inr=None,
            variance_amount=None,
            percentage_over_budget=None,
            is_acceptable=False,
        )

    variance = price_inr - budget_inr
    percentage = (
        ((variance / budget_inr) * Decimal("100")).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        if budget_inr > 0
        else Decimal("100.00")
    )

    is_acceptable = category in (BudgetCategory.WITHIN_BUDGET, BudgetCategory.STRETCH)

    return BudgetMatchResult(
        category=category,
        budget_inr=budget_inr,
        price_inr=price_inr,
        variance_amount=variance,
        percentage_over_budget=percentage if variance > 0 else Decimal("0.00"),
        is_acceptable=is_acceptable,
    )
