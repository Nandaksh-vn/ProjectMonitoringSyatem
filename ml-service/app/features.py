"""Shared feature engineering for InfraWatch ML models.

This module is imported by BOTH the training pipeline and the serving API so
that the column names, ordering and arithmetic used at fit time are byte-for-byte
identical to those used at inference time. Train/serve skew is the single most
common cause of silent accuracy collapse in SHAP-based systems, so the logic is
deliberately kept in one place.

Two independent feature blocks exist because they answer two different questions:

COST_BLOCK      -> "Will this project breach its sanctioned budget?"
SCHEDULE_BLOCK  -> "Will this project miss its completion date, and how risky is it overall?"
"""

from __future__ import annotations

from typing import Any, Dict, Iterable, List

import numpy as np

COST_FEATURE_NAMES: List[str] = [
    "Budget",
    "MaterialCost",
    "LaborCost",
    "EquipmentCost",
    "TotalCurrentExpenditure",
    "ExpenditureToBudgetRatio",
    "progress_pct",
]

SCHEDULE_FEATURE_NAMES: List[str] = [
    "Budget",
    "PhysicalProgress",
    "FinancialProgress",
    "ProgressGap",
    "CostGrowthPct",
    "ExpenditureToBudgetRatio",
    "DelayedMilestoneRatio",
    "ElapsedDurationMonths",
    "RemainingDurationMonths",
    "ScheduleConsumptionRatio",
]

COST_BLOCK_DESCRIPTION = {
    "Budget": "Sanctioned project cost (INR crore).",
    "MaterialCost": "Expenditure on materials to date (INR crore).",
    "LaborCost": "Expenditure on labour to date (INR crore).",
    "EquipmentCost": "Expenditure on equipment to date (INR crore).",
    "TotalCurrentExpenditure": "Material + labour + equipment spend to date.",
    "ExpenditureToBudgetRatio": "Spend-to-sanction ratio; the core cost-pressure signal.",
    "progress_pct": "Reported physical completion as a fraction between 0 and 1.",
}

SCHEDULE_BLOCK_DESCRIPTION = {
    "Budget": "Sanctioned project cost (INR crore); larger works tolerate more slippage.",
    "PhysicalProgress": "Physical completion as a fraction between 0 and 1.",
    "FinancialProgress": "Financial completion as a fraction between 0 and 1.",
    "ProgressGap": "Physical minus financial progress; negative means money is being spent ahead of work.",
    "CostGrowthPct": "Percentage cost revision over the original sanction.",
    "ExpenditureToBudgetRatio": "Spend-to-sanction ratio.",
    "DelayedMilestoneRatio": "Delayed milestones divided by total planned milestones.",
    "ElapsedDurationMonths": "Months elapsed since the scheduled start date.",
    "RemainingDurationMonths": "Months remaining until the current completion target.",
    "ScheduleConsumptionRatio": "Share of the total duration already consumed.",
}


def safe_div(numerator, denominator, default: float = 0.0):
    """Division that degrades to `default` instead of raising or producing inf.

    Element-wise safe: accepts scalars or numpy arrays and preserves the input shape.
    """
    num = np.asarray(numerator, dtype=float)
    den = np.asarray(denominator, dtype=float)
    out = np.full(np.broadcast(num, den).shape, float(default), dtype=float)
    valid = den != 0
    np.divide(num, den, out=out, where=valid)
    return np.nan_to_num(out, nan=float(default), posinf=float(default), neginf=float(default))


def clamp(value, low: float, high: float):
    """Element-wise clamp preserving the input shape."""
    return np.clip(np.asarray(value, dtype=float), low, high)


def _nonneg(value):
    return np.clip(np.asarray(value, dtype=float), 0.0, None)


def build_cost_features(
    budget,
    material_cost,
    labor_cost,
    equipment_cost,
    progress_pct,
) -> Dict[str, Any]:
    """Build the cost-overrun feature row from raw monetary inputs.

    Accepts scalars or array-likes; returns a dict of same-shaped numpy values.
    """
    budget = _nonneg(budget)
    material_cost = _nonneg(material_cost)
    labor_cost = _nonneg(labor_cost)
    equipment_cost = _nonneg(equipment_cost)
    progress_pct = clamp(progress_pct, 0.0, 1.0)

    total = material_cost + labor_cost + equipment_cost
    return {
        "Budget": budget,
        "MaterialCost": material_cost,
        "LaborCost": labor_cost,
        "EquipmentCost": equipment_cost,
        "TotalCurrentExpenditure": total,
        "ExpenditureToBudgetRatio": safe_div(total, budget, 0.0),
        "progress_pct": progress_pct,
    }


def build_schedule_features(
    approved_cost,
    revised_cost,
    current_expenditure,
    physical_progress,
    financial_progress,
    milestones_planned,
    milestones_delayed,
    elapsed_duration_months,
    remaining_duration_months,
) -> Dict[str, Any]:
    """Build the schedule/overall-risk feature row from project monitoring data.

    Accepts scalars or array-likes; returns a dict of same-shaped numpy values.
    """
    approved_cost = _nonneg(approved_cost)
    revised_cost = _nonneg(revised_cost)
    current_expenditure = _nonneg(current_expenditure)

    physical = clamp(physical_progress, 0.0, 1.0)
    financial = clamp(financial_progress, 0.0, 1.0)

    planned = np.clip(np.asarray(milestones_planned, dtype=float), 0.0, None)
    delayed = np.clip(np.asarray(milestones_delayed, dtype=float), 0.0, None)
    delayed = np.minimum(delayed, planned)

    elapsed = _nonneg(elapsed_duration_months)
    remaining = _nonneg(remaining_duration_months)
    total_duration = elapsed + remaining

    denominator = np.where(approved_cost > 0, approved_cost, revised_cost)

    return {
        "Budget": denominator,
        "PhysicalProgress": physical,
        "FinancialProgress": financial,
        "ProgressGap": physical - financial,
        "CostGrowthPct": safe_div(revised_cost - approved_cost, approved_cost, 0.0) * 100.0,
        "ExpenditureToBudgetRatio": safe_div(current_expenditure, denominator, 0.0),
        "DelayedMilestoneRatio": safe_div(delayed, planned, 0.0),
        "ElapsedDurationMonths": elapsed,
        "RemainingDurationMonths": remaining,
        "ScheduleConsumptionRatio": safe_div(elapsed, total_duration, 0.0),
    }


def to_ordered_row(features: Dict[str, Any], names: Iterable[str]) -> List[float]:
    return [float(features[name]) for name in names]
