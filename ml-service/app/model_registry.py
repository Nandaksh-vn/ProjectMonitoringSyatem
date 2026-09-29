"""Model loading and inference for InfraWatch.

Responsibilities kept here (previously spread across `app/main.py`):
  * resolve artifact paths relative to the package, not the process CWD
  * load the scaler/model pair for each target
  * score a project and return calibrated probabilities / point estimates
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

import joblib
import numpy as np
import pandas as pd

from app.config import DEFAULT_MODEL_SET, MODEL_SETS, MODEL_VERSION, MODELS_DIR
from app.features import COST_FEATURE_NAMES, SCHEDULE_FEATURE_NAMES, build_cost_features, build_schedule_features

COST_TARGET = "cost_overrun_risk"
TIME_TARGET = "time_overrun_risk"
RISK_TARGET = "overall_risk_score"

RISK_BANDS: List[tuple] = [(0.0, 40.0, "LOW"), (40.0, 60.0, "MEDIUM"), (60.0, 75.0, "HIGH"), (75.0, 100.01, "CRITICAL")]

SHAP_DISCLAIMER = (
    "SHAP values show model association and contribution direction. "
    "They do not by themselves establish causation."
)


def risk_level_for(score: float) -> str:
    for low, high, label in RISK_BANDS:
        if low <= score < high:
            return label
    return "CRITICAL"


@dataclass
class LoadedTarget:
    model: Any
    scaler: Any
    feature_names: List[str]
    model_name: str
    model_class: str
    dataset: str
    metrics: Dict[str, float] = field(default_factory=dict)
    global_importance: List[Dict[str, Any]] = field(default_factory=list)
    feature_descriptions: Dict[str, str] = field(default_factory=dict)

    def frame(self, features: Dict[str, Any]) -> pd.DataFrame:
        return pd.DataFrame([{name: float(features[name]) for name in self.feature_names}])

    def transform(self, features: Dict[str, Any]) -> np.ndarray:
        return self.scaler.transform(self.frame(features))


class ModelRegistry:
    """Loads every artifact once at import time and serves predictions from memory."""

    def __init__(self, model_set: str = DEFAULT_MODEL_SET) -> None:
        self.model_set = model_set if model_set in MODEL_SETS else "v3_full"
        self.directory = MODELS_DIR / self.model_set
        self.targets: Dict[str, LoadedTarget] = {}
        self.load_errors: Dict[str, str] = {}
        self.metadata: Dict[str, Any] = {}
        self.loaded = False

    def load(self) -> None:
        metrics_path = self.directory / "metrics.json"
        if metrics_path.exists():
            try:
                self.metadata = json.loads(metrics_path.read_text(encoding="utf-8"))
            except (OSError, ValueError) as exc:
                self.load_errors["metrics.json"] = str(exc)

        specs = [
            (COST_TARGET, COST_FEATURE_NAMES, False),
            (TIME_TARGET, SCHEDULE_FEATURE_NAMES, True),
            (RISK_TARGET, SCHEDULE_FEATURE_NAMES, False),
        ]

        for target, feature_names, _is_classifier in specs:
            try:
                model = joblib.load(self.directory / f"best_{target}_model.joblib")
                scaler = joblib.load(self.directory / f"scaler_{target}.joblib")
            except Exception as exc:
                self.load_errors[target] = str(exc)
                continue

            meta = self.metadata.get("targets", {}).get(target, {})
            self.targets[target] = LoadedTarget(
                model=model,
                scaler=scaler,
                feature_names=list(feature_names),
                model_name=meta.get("model", type(model).__name__),
                model_class=meta.get("model_class", type(model).__name__),
                dataset=meta.get("dataset", "unknown"),
                metrics=meta.get("metrics", {}),
                global_importance=meta.get("global_feature_importance", []),
                feature_descriptions=meta.get("feature_descriptions", {}),
            )

        self.loaded = bool(self.targets)

    def has(self, target: str) -> bool:
        return target in self.targets

    def metadata_for(self, target: str) -> LoadedTarget:
        return self.targets[target]

    def predict_cost(self, cost_features: Dict[str, Any]) -> Dict[str, Any]:
        target = self.targets[COST_TARGET]
        matrix = target.transform(cost_features)
        if hasattr(target.model, "predict_proba"):
            probability = float(target.model.predict_proba(matrix)[0][1])
        else:
            probability = float(target.model.predict(matrix)[0])
        return {
            "cost_overrun_risk_probability": round(probability, 6),
            "prediction": int(probability > 0.5),
            "model_version": MODEL_VERSION,
            "model_name": target.model_name,
            "dataset": target.dataset,
        }

    def predict_time(self, schedule_features: Dict[str, Any], threshold_months: float) -> Dict[str, Any]:
        target = self.targets[TIME_TARGET]
        matrix = target.transform(schedule_features)
        if hasattr(target.model, "predict_proba"):
            probability = float(target.model.predict_proba(matrix)[0][1])
        else:
            probability = float(target.model.predict(matrix)[0])

        return {
            "time_overrun_probability": round(probability, 6),
            "predicted_delay_months": round(self.expected_delay_months(probability, threshold_months), 2),
            "prediction": int(probability > 0.5),
            "delay_threshold_months": threshold_months,
            "model_version": MODEL_VERSION,
            "model_name": target.model_name,
            "dataset": target.dataset,
        }

    def predict_risk(self, schedule_features: Dict[str, Any]) -> Dict[str, Any]:
        target = self.targets[RISK_TARGET]
        matrix = target.transform(schedule_features)
        score = float(target.model.predict(matrix)[0])
        score = max(0.0, min(100.0, score))
        return {
            "overall_risk_score": round(score, 2),
            "risk_level": risk_level_for(score),
            "model_version": MODEL_VERSION,
            "model_name": target.model_name,
            "dataset": target.dataset,
        }

    @staticmethod
    def expected_delay_months(probability: float, threshold_months: float) -> float:
        """Map a slip probability onto an expected slippage in months.

        The classifier is trained on a binary label, so it produces no magnitude.
        This maps probability onto a plausible range anchored at the classification
        threshold and is reported as an estimate, not a regression output.
        """
        if probability <= 0.5:
            span = threshold_months * 0.9
            return probability / 0.5 * span
        span = threshold_months * 3.0
        return threshold_months + (probability - 0.5) / 0.5 * span

    def global_importance(self, limit: int = 8) -> List[Dict[str, Any]]:
        target = self.targets.get(COST_TARGET) or next(iter(self.targets.values()), None)
        if target is None:
            return []
        return [
            {
                "factor_name": item["feature"],
                "shap_value": round(float(item["mean_abs_shap"]), 6),
                "impact_direction": "INCREASES_RISK",
                "description": item.get("description", ""),
            }
            for item in target.global_importance[:limit]
        ]

    def status(self) -> Dict[str, Any]:
        return {
            "status": "ok" if self.loaded else "degraded",
            "models_loaded": self.loaded,
            "model_set": self.model_set,
            "model_version": MODEL_VERSION,
            "available_targets": sorted(self.targets.keys()),
            "missing_targets": sorted(
                {COST_TARGET, TIME_TARGET, RISK_TARGET} - set(self.targets.keys())
            ),
            "errors": self.load_errors,
        }


registry = ModelRegistry()
registry.load()


def split_expenditure(current_expenditure: float) -> tuple:
    """Split cumulative spend into the CUF material/labour/equipment components.

    InfraWatch's `projects` table stores a single cumulative expenditure figure
    rather than a cost breakup, so the split uses standard CUF cost-composition
    norms. Documented as an assumption in `model_comparison_report.md`.
    """
    spend = max(float(current_expenditure), 0.0)
    return spend * 0.52, spend * 0.31, spend * 0.17


def cost_features_for(payload) -> Dict[str, Any]:
    material = payload.material_cost
    labor = payload.labor_cost
    equipment = payload.equipment_cost
    if material is None or labor is None or equipment is None:
        auto_material, auto_labor, auto_equipment = split_expenditure(payload.current_expenditure)
        material = auto_material if material is None else material
        labor = auto_labor if labor is None else labor
        equipment = auto_equipment if equipment is None else equipment
    return build_cost_features(
        budget=payload.approved_cost,
        material_cost=material,
        labor_cost=labor,
        equipment_cost=equipment,
        progress_pct=payload.physical_progress,
    )


def schedule_features_for(payload) -> Dict[str, Any]:
    return build_schedule_features(
        approved_cost=payload.approved_cost,
        revised_cost=payload.revised_cost,
        current_expenditure=payload.current_expenditure,
        physical_progress=payload.physical_progress,
        financial_progress=payload.financial_progress,
        milestones_planned=payload.milestones_planned,
        milestones_delayed=payload.milestones_delayed,
        elapsed_duration_months=payload.elapsed_duration_months,
        remaining_duration_months=payload.remaining_duration_months,
    )
