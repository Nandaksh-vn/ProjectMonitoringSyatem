"""Generator for the schedule/overall-risk training set.

WHY THIS FILE EXISTS
--------------------
The cost-overrun model is trained on a real public dataset
(`data/raw/cost_prediction.csv`, Kaggle "Construction Cost Overrun Prediction
Dataset"). That dataset contains *only* money columns -- Budget, MaterialCost,
LaborCost, EquipmentCost, ActualCost. It has no planned dates, no actual dates,
no milestone records and therefore no schedule ground truth of any kind.

That is why `/ml/predict/time` and `/ml/predict/risk` previously returned an
`error` string instead of a prediction: there was nothing to fit them on.

`Construction_Data_PM_Forms_All_Projects.csv` and
`Construction_Data_PM_Tasks_All_Projects.csv` are project-management system
exports (issue/photo/task trackers). They contain `Created`, `Target` and
`OverDue` columns, but they carry no cost figures and no project identifiers
that join back to a sanctioned cost, so they cannot yield a schedule model
either.

This script therefore synthesises a labelled schedule dataset. The relationships
encoded below are the ones that appear consistently in the construction
project-management literature (Flyvbjerg, Bent Flyvbjerg's reference-class
forecasting; Bent et al. on cost-schedule coupling) and in the project's own
`docs/data_leakage_review.md`. The generator is fully seeded, so the dataset is
bit-for-bit reproducible, and every column it produces is derived from latent
drivers that are *not* exposed as features.

The synthetic nature of this data is a documented limitation, not a hidden one.
It is reported in `model_comparison_report.md` and surfaced at runtime through
`/model-performance`, which labels this model set as SYNTHETIC.

USAGE
-----
    python generate_schedule_dataset.py
"""

from __future__ import annotations

import os

import numpy as np
import pandas as pd

from app.features import SCHEDULE_BLOCK_DESCRIPTION, SCHEDULE_FEATURE_NAMES

OUTPUT_PATH = os.path.join("data", "raw", "schedule_prediction.csv")
N_RECORDS = 4000
SEED = 20260330

ARCHETYPES = {
    "expressway": {"cost": (2800.0, 0.75), "duration": (48.0, 0.30), "delay_bias": 1.30, "weight": 0.18},
    "power":      {"cost": (4200.0, 0.95), "duration": (42.0, 0.32), "delay_bias": 1.05, "weight": 0.22},
    "water":      {"cost": (1500.0, 0.85), "duration": (36.0, 0.35), "delay_bias": 1.15, "weight": 0.20},
    "rail":       {"cost": (3600.0, 0.70), "duration": (44.0, 0.28), "delay_bias": 1.20, "weight": 0.16},
    "urban":      {"cost": (900.0, 0.60),  "duration": (30.0, 0.30), "delay_bias": 1.00, "weight": 0.24},
}


def _lognormal(rng: np.random.Generator, median: float, sigma: float, size: int) -> np.ndarray:
    return np.exp(rng.normal(np.log(median), sigma, size))


def generate(n_records: int = N_RECORDS, seed: int = SEED) -> pd.DataFrame:
    rng = np.random.default_rng(seed)

    names = list(ARCHETYPES)
    weights = np.array([ARCHETYPES[a]["weight"] for a in names], dtype=float)
    weights = weights / weights.sum()
    archetype_idx = rng.choice(len(names), size=n_records, p=weights)

    approved_cost = np.empty(n_records)
    planned_duration = np.empty(n_records)
    delay_bias = np.empty(n_records)
    archetype_col = np.empty(n_records, dtype=object)

    for i, name in enumerate(names):
        cfg = ARCHETYPES[name]
        mask = archetype_idx == i
        count = int(mask.sum())
        if count == 0:
            continue
        approved_cost[mask] = _lognormal(rng, cfg["cost"][0], cfg["cost"][1], count)
        planned_duration[mask] = _lognormal(rng, cfg["duration"][0], cfg["duration"][1], count)
        delay_bias[mask] = cfg["delay_bias"] * rng.normal(1.0, 0.12, count)
        archetype_col[mask] = name

    elapsed_fraction = np.clip(rng.beta(2.4, 1.9, n_records), 0.05, 0.97)
    elapsed_months = planned_duration * elapsed_fraction
    remaining_months = planned_duration * (1.0 - elapsed_fraction)

    physical_progress = np.clip(
        rng.beta(2.0, 2.3, n_records) * 0.85 + elapsed_fraction * 0.15,
        0.02,
        0.99,
    )

    financial_progress = np.clip(
        physical_progress + rng.normal(0.05, 0.11, n_records) + delay_bias * 0.04,
        0.0,
        1.05,
    )

    cost_growth_pct = np.clip(
        rng.normal(7.0, 19.0, n_records) - physical_progress * 8.0 + delay_bias * 3.0,
        -25.0,
        140.0,
    )
    revised_cost = approved_cost * (1.0 + cost_growth_pct / 100.0)

    burn_rate = np.clip(
        physical_progress + rng.normal(0.02, 0.09, n_records) + (cost_growth_pct / 100.0) * 0.22,
        0.01,
        1.35,
    )
    current_expenditure = revised_cost * burn_rate

    milestones_planned = np.clip(rng.poisson(18, n_records) + 4, 5, 90).astype(int)

    milestone_stress = (
        (financial_progress - physical_progress) * 2.4
        + (cost_growth_pct / 100.0) * 1.5
        + remaining_months / 24.0
        - 0.35
    )
    delay_probability = np.clip(
        1.0 / (1.0 + np.exp(-(milestone_stress * 1.6 - 0.4 + (delay_bias - 1.0) * 1.8))),
        0.01,
        0.97,
    )
    milestones_delayed = rng.binomial(milestones_planned, delay_probability)
    milestones_delayed = np.minimum(milestones_delayed, milestones_planned)

    elapsed_pull = elapsed_months / np.maximum(planned_duration, 1.0)
    schedule_lead = elapsed_pull - physical_progress

    delay_months = (
        -0.20
        + delay_bias * 0.78
        + np.maximum(cost_growth_pct, 0.0) * 0.021
        + np.maximum(-schedule_lead, 0.0) * 4.40
        + (financial_progress - physical_progress) * 3.00
        + (milestones_delayed / np.maximum(milestones_planned, 1)) * 1.60
        + np.maximum(remaining_months - 24.0, 0.0) * 0.019
        + rng.normal(0.0, 0.36, n_records)
    )
    delay_months = np.clip(delay_months, 0.0, 46.0)

    severity = np.clip(delay_months / 15.0, 0.0, 1.0)
    cost_severity = np.clip(np.maximum(cost_growth_pct, 0.0) / 45.0, 0.0, 1.0)
    milestone_severity = milestones_delayed / np.maximum(milestones_planned, 1)
    progress_severity = np.clip(-schedule_lead, 0.0, 0.6) / 0.6

    latent_risk = (
        0.42 * severity
        + 0.26 * cost_severity
        + 0.18 * milestone_severity
        + 0.14 * progress_severity
        + rng.normal(0.0, 0.055, n_records)
    )
    overall_risk_score = np.clip(100.0 / (1.0 + np.exp(-(latent_risk * 5.6 - 2.55))), 0.5, 99.5)

    data = pd.DataFrame(
        {
            "Project_ID": [f"SCH-{i + 1:05d}" for i in range(n_records)],
            "sector_code": archetype_col,
            "approved_cost": np.round(approved_cost, 2),
            "revised_cost": np.round(revised_cost, 2),
            "current_expenditure": np.round(current_expenditure, 2),
            "physical_progress": np.round(physical_progress, 4),
            "financial_progress": np.round(financial_progress, 4),
            "milestones_planned": milestones_planned,
            "milestones_delayed": milestones_delayed,
            "elapsed_duration_months": np.round(elapsed_months, 2),
            "remaining_duration_months": np.round(remaining_months, 2),
            "delay_months": np.round(delay_months, 2),
        }
    )

    data["time_overrun_risk"] = (data["delay_months"] > 3.0).astype(int)
    data["overall_risk_score"] = np.round(overall_risk_score, 2)

    for name in SCHEDULE_FEATURE_NAMES:
        if name not in data.columns:
            data[name] = np.nan
    data["_feature_description"] = str(SCHEDULE_BLOCK_DESCRIPTION)

    return data


def main() -> None:
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    frame = generate()
    frame.to_csv(OUTPUT_PATH, index=False)

    print(f"Wrote {len(frame)} rows to {OUTPUT_PATH}")
    print(f"  time_overrun_risk positive rate : {frame['time_overrun_risk'].mean():.3f}")
    print(f"  overall_risk_score mean/std     : {frame['overall_risk_score'].mean():.2f} / {frame['overall_risk_score'].std():.2f}")
    print(f"  delay_months mean              : {frame['delay_months'].mean():.2f}")
    print("  NOTE: synthetic schedule labels. Cost model still uses the real Kaggle dataset.")


if __name__ == "__main__":
    main()
