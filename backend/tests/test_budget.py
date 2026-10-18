from decimal import Decimal
import pytest
from app.services.find_care.budget import (
    BudgetCategory,
    categorize_budget,
    evaluate_budget_match,
)


def test_budget_within_boundary():
    budget = Decimal("10000.00")
    # Equal to budget
    assert categorize_budget(budget, Decimal("10000.00")) == BudgetCategory.WITHIN_BUDGET
    # Strictly less than budget
    assert categorize_budget(budget, Decimal("9999.99")) == BudgetCategory.WITHIN_BUDGET
    assert categorize_budget(budget, Decimal("5000.00")) == BudgetCategory.WITHIN_BUDGET


def test_budget_stretch_boundary():
    budget = Decimal("10000.00")
    # 11999 is <= 12000 (20% over) -> STRETCH
    assert categorize_budget(budget, Decimal("11999.00")) == BudgetCategory.STRETCH
    # Exactly 12000 is 20% over -> STRETCH
    assert categorize_budget(budget, Decimal("12000.00")) == BudgetCategory.STRETCH


def test_budget_over_boundary():
    budget = Decimal("10000.00")
    # 12001 is > 12000 -> OVER_BUDGET
    assert categorize_budget(budget, Decimal("12001.00")) == BudgetCategory.OVER_BUDGET
    # Significantly higher
    assert categorize_budget(budget, Decimal("25000.00")) == BudgetCategory.OVER_BUDGET


def test_budget_price_unavailable():
    budget = Decimal("10000.00")
    assert categorize_budget(budget, None) == BudgetCategory.PRICE_UNAVAILABLE
    assert categorize_budget(budget, Decimal("0.00")) == BudgetCategory.PRICE_UNAVAILABLE
    assert categorize_budget(budget, Decimal("-500.00")) == BudgetCategory.PRICE_UNAVAILABLE


def test_evaluate_budget_match_details():
    budget = Decimal("10000.00")
    price = Decimal("11500.00")

    res = evaluate_budget_match(budget, price)
    assert res.category == BudgetCategory.STRETCH
    assert res.is_acceptable is True
    assert res.variance_amount == Decimal("1500.00")
    assert res.percentage_over_budget == Decimal("15.00")


def test_evaluate_budget_match_unavailable():
    budget = Decimal("10000.00")
    res = evaluate_budget_match(budget, None)
    assert res.category == BudgetCategory.PRICE_UNAVAILABLE
    assert res.is_acceptable is False
    assert res.price_inr is None
    assert res.variance_amount is None
