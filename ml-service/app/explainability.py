"""SHAP explainability for InfraWatch.

Provides both granularities of explanation the product needs:

  local   per-prediction factor attribution, shown on the project detail screen
  global  mean absolute SHAP across the training set, shown on Model Performance

The LinearExplainer background matrix is derived from the fitted scaler's own
training statistics rather than being an all-zeros dummy, which is what the
previous implementation used and which produced attribution magnitudes with no
interpretable scale.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

import numpy as np
import shap

from app.config import MODEL_VERSION
from app.model_registry import SHAP_DISCLAIMER, LoadedTarget, ModelRegistry

_explainers: Dict[str, Any] = {}


def _background_for(target: LoadedTarget) -> np.ndarray:
    mean = np.asarray(target.scaler.mean_, dtype=float).reshape(1, -1)
    scale = np.asarray(target.scaler.scale_, dtype=float).reshape(1, -1)
    scale[scale == 0] = 1.0
    rng = np.random.default_rng(0)
    return mean + rng.normal(0.0, 1.0, size=(64, mean.shape[1])) * scale


def _explainer_for(target: LoadedTarget):
    key = f"{id(target.model)}"
    if key not in _explainers:
        class_name = type(target.model).__name__
        if "Linear" in class_name or "Logistic" in class_name:
            _explainers[key] = shap.LinearExplainer(target.model, _background_for(target))
        else:
            _explainers[key] = shap.TreeExplainer(target.model)
    return _explainers[key]


def _shap_row(explainer, matrix: np.ndarray) -> np.ndarray:
    values = explainer.shap_values(matrix)
    if isinstance(values, list):
        values = values[-1]
    values = np.asarray(values)
    if values.ndim == 3:
        return values[:, :, -1][0]
    return values[0]


def _base_value(explainer) -> Optional[float]:
    try:
        value = explainer.expected_value
        if isinstance(value, np.ndarray):
            value = value[-1] if value.ndim else value
        return round(float(value), 6)
    except (AttributeError, TypeError, ValueError):
        return None


def explain(registry: ModelRegistry, target_name: str, features: Dict[str, Any], limit: int = 6) -> Dict[str, Any]:
    """Return per-feature SHAP attribution for one project, strongest first."""
    if not registry.has(target_name):
        return {
            "error": f"Target '{target_name}' is not loaded.",
            "top_factors": [],
            "global_importance": [],
            "disclaimer": SHAP_DISCLAIMER,
            "model_version": MODEL_VERSION,
        }

    target = registry.metadata_for(target_name)
    matrix = target.transform(features)
    explainer = _explainer_for(target)

    try:
        row = _shap_row(explainer, matrix)
    except Exception as exc:  # pragma: no cover - defensive
        return {
            "error": f"Explainability unavailable for {type(target.model).__name__}: {exc}",
            "top_factors": [],
            "global_importance": [],
            "disclaimer": SHAP_DISCLAIMER,
            "model_version": MODEL_VERSION,
        }

    factors: List[Dict[str, Any]] = []
    for name, value in zip(target.feature_names, row):
        value = float(value)
        factors.append(
            {
                "factor_name": name,
                "shap_value": round(value, 6),
                "impact_direction": "INCREASES_RISK" if value > 0 else "DECREASES_RISK",
                "description": target.feature_descriptions.get(name, ""),
            }
        )

    factors.sort(key=lambda item: abs(item["shap_value"]), reverse=True)
    return {
        "top_factors": factors[:limit],
        "global_importance": [
            {
                "factor_name": item["feature"],
                "shap_value": round(float(item["mean_abs_shap"]), 6),
                "impact_direction": "INCREASES_RISK",
                "description": item.get("description", ""),
            }
            for item in target.global_importance[:8]
        ],
        "base_value": _base_value(explainer),
        "disclaimer": SHAP_DISCLAIMER,
        "model_version": MODEL_VERSION,
    }
