"""InfraWatch AI ML Service - FastAPI application.

Serves three independently trained models plus SHAP explainability:

    POST /ml/predict/cost   cost-overrun risk probability        (real Kaggle dataset)
    POST /ml/predict/time   schedule-slip probability + months   (synthetic labels)
    POST /ml/predict/risk   overall risk score 0-100 + band      (synthetic labels)
    POST /ml/explain        local SHAP attribution for a project
    POST /ml/predict/full   all of the above in one round trip
    GET  /model-performance experiment table, selected models, global importance
    GET  /health            readiness probe used by the Spring Boot backend

The Spring Boot backend calls `/ml/predict/full` from its prediction sync job
and writes the result into `predictions` and `risk_factors`.
"""

from __future__ import annotations

import os
from typing import Any, Dict, List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app import explainability
from app.config import API_VERSION, DELAY_THRESHOLD_MONTHS, MODEL_VERSION
from app.features import (
    COST_BLOCK_DESCRIPTION,
    COST_FEATURE_NAMES,
    SCHEDULE_BLOCK_DESCRIPTION,
    SCHEDULE_FEATURE_NAMES,
)
from app.model_registry import (
    COST_TARGET,
    RISK_TARGET,
    SHAP_DISCLAIMER,
    TIME_TARGET,
    ModelRegistry,
    cost_features_for,
    registry,
    schedule_features_for,
)
from app.schemas import (
    CostFeatureRequest,
    CostPredictionResponse,
    ExplanationResponse,
    FullPredictionResponse,
    ProjectFeaturesRequest,
    RiskPredictionResponse,
    TimePredictionResponse,
)

app = FastAPI(
    title="InfraWatch AI ML Service",
    version=API_VERSION,
    description="Cost/schedule risk inference and SHAP explainability for central-sector infrastructure projects.",
)

# Origins are configured explicitly via CORS_ALLOWED_ORIGINS. A wildcard paired
# with credentials is rejected by browsers, and "*" would let any site call this
# API from a visitor's browser. Defaults to the local frontend only.
_CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


def _require(target: str) -> None:
    if not registry.has(target):
        status = registry.status()
        raise HTTPException(
            status_code=503,
            detail=(
                f"Model '{target}' is not available. Loaded: {status['available_targets']}. "
                f"Errors: {status['errors']}. Run `python train_and_evaluate.py`."
            ),
        )


def _full_payload(payload: ProjectFeaturesRequest) -> Dict[str, Any]:
    cost_features = cost_features_for(payload)
    schedule_features = schedule_features_for(payload)
    return {
        "cost": registry.predict_cost(cost_features),
        "time": registry.predict_time(schedule_features, DELAY_THRESHOLD_MONTHS),
        "risk": registry.predict_risk(schedule_features),
        "explanation": explainability.explain(registry, COST_TARGET, cost_features, limit=6),
    }


@app.get("/health")
def health_check() -> Dict[str, Any]:
    return registry.status()


@app.get("/model-performance")
def model_performance() -> Dict[str, Any]:
    """Experiment comparison, selected models and global feature importance.

    Consumed directly by the frontend Model Performance screen.
    """
    targets = registry.metadata.get("targets", {})
    experiments = registry.metadata.get("all_experiments", [])

    def rows_for(target: str) -> List[Dict[str, Any]]:
        return [
            {
                "target": row["target"],
                "task": row["task"],
                "dataset": row["dataset"],
                "experiment": row["experiment"],
                "model": row["model"],
                "metrics": {
                    key: round(float(value), 6)
                    for key, value in row.items()
                    if key not in {"target", "task", "dataset", "experiment", "model"}
                },
            }
            for row in experiments
            if row["target"] == target
        ]

    selected = {
        target: {
            "model": meta.get("model"),
            "model_class": meta.get("model_class"),
            "task": meta.get("task"),
            "dataset": meta.get("dataset"),
            "model_version": meta.get("model_version", MODEL_VERSION),
            "metrics": {k: round(float(v), 6) for k, v in meta.get("metrics", {}).items()},
            "n_train": meta.get("n_train"),
            "n_test": meta.get("n_test"),
            "feature_names": meta.get("feature_names", []),
            "global_feature_importance": meta.get("global_feature_importance", []),
        }
        for target, meta in targets.items()
    }

    return {
        "model_version": registry.metadata.get("model_version", MODEL_VERSION),
        "trained_at": registry.metadata.get("trained_at"),
        "model_set": registry.model_set,
        "targets": selected,
        "experiments": {
            COST_TARGET: rows_for(COST_TARGET),
            TIME_TARGET: rows_for(TIME_TARGET),
            RISK_TARGET: rows_for(RISK_TARGET),
        },
        "global_feature_importance": registry.global_importance(limit=10),
        "feature_blocks": {
            "cost": {"features": COST_FEATURE_NAMES, "descriptions": COST_BLOCK_DESCRIPTION},
            "schedule": {"features": SCHEDULE_FEATURE_NAMES, "descriptions": SCHEDULE_BLOCK_DESCRIPTION},
        },
        "limitations": [
            "cost_overrun_risk is trained on a real public dataset; time and overall-risk models are trained on seeded synthetic labels because the source dataset has no date or milestone columns.",
            "The cost dataset carries no sector, ministry or geography columns, so those are handled by the backend rules engine rather than the model.",
            "progress_pct in the cost experiment is simulated to represent an in-flight project.",
            "High ROC-AUC on the cost target reflects a near-linearly separable spend ratio; treat it as a sanity check, not a generalisation guarantee.",
        ],
    }


@app.get("/features")
def feature_catalogue() -> Dict[str, Any]:
    return {
        "cost": {"features": COST_FEATURE_NAMES, "descriptions": COST_BLOCK_DESCRIPTION},
        "schedule": {"features": SCHEDULE_FEATURE_NAMES, "descriptions": SCHEDULE_BLOCK_DESCRIPTION},
    }


@app.post("/ml/predict/cost", response_model=CostPredictionResponse)
def predict_cost(payload: ProjectFeaturesRequest) -> Dict[str, Any]:
    _require(COST_TARGET)
    return registry.predict_cost(cost_features_for(payload))


@app.post("/ml/predict/cost-legacy", response_model=CostPredictionResponse)
def predict_cost_legacy(payload: CostFeatureRequest) -> Dict[str, Any]:
    """Backward-compatible entry point for the original 5-field payload."""
    from app.features import build_cost_features

    _require(COST_TARGET)
    features = build_cost_features(
        budget=payload.Budget,
        material_cost=payload.MaterialCost,
        labor_cost=payload.LaborCost,
        equipment_cost=payload.EquipmentCost,
        progress_pct=payload.progress_pct,
    )
    return registry.predict_cost(features)


@app.post("/ml/predict/time", response_model=TimePredictionResponse)
def predict_time(payload: ProjectFeaturesRequest) -> Dict[str, Any]:
    _require(TIME_TARGET)
    return registry.predict_time(schedule_features_for(payload), DELAY_THRESHOLD_MONTHS)


@app.post("/ml/predict/risk", response_model=RiskPredictionResponse)
def predict_risk(payload: ProjectFeaturesRequest) -> Dict[str, Any]:
    _require(RISK_TARGET)
    return registry.predict_risk(schedule_features_for(payload))


@app.post("/ml/explain", response_model=ExplanationResponse)
def explain_prediction(payload: ProjectFeaturesRequest) -> Dict[str, Any]:
    _require(COST_TARGET)
    result = explainability.explain(registry, COST_TARGET, cost_features_for(payload), limit=6)
    if "error" in result:
        raise HTTPException(status_code=503, detail=result["error"])
    return result


@app.post("/ml/explain/schedule", response_model=ExplanationResponse)
def explain_schedule(payload: ProjectFeaturesRequest) -> Dict[str, Any]:
    _require(TIME_TARGET)
    result = explainability.explain(registry, TIME_TARGET, schedule_features_for(payload), limit=6)
    if "error" in result:
        raise HTTPException(status_code=503, detail=result["error"])
    return result


@app.post("/ml/predict/full", response_model=FullPredictionResponse)
def predict_full(payload: ProjectFeaturesRequest) -> Dict[str, Any]:
    _require(COST_TARGET)
    _require(TIME_TARGET)
    _require(RISK_TARGET)
    result = _full_payload(payload)
    result["model_version"] = MODEL_VERSION
    return result


@app.get("/")
def root() -> Dict[str, Any]:
    return {
        "service": "InfraWatch AI ML Service",
        "version": API_VERSION,
        "model_version": MODEL_VERSION,
        "status": registry.status(),
        "endpoints": [
            "GET  /health",
            "GET  /model-performance",
            "GET  /features",
            "POST /ml/predict/cost",
            "POST /ml/predict/cost-legacy",
            "POST /ml/predict/time",
            "POST /ml/predict/risk",
            "POST /ml/predict/full",
            "POST /ml/explain",
            "POST /ml/explain/schedule",
        ],
        "disclaimer": SHAP_DISCLAIMER,
        "docs": "/docs",
    }
