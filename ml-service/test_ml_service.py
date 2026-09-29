"""Test suite for the InfraWatch ML service.

Replaces the previous `test_api.py` / `test_fastapi_v2.py` pair, neither of
which pytest could actually collect: one sent a payload the v2 API rejected with
HTTP 422, and the other defined `run_tests()` rather than a `test_*` function, so
zero tests ran.

    python -m pytest -q
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.config import DELAY_THRESHOLD_MONTHS, MODEL_VERSION
from app.main import app
from app.model_registry import registry

client = TestClient(app)

requires_models = pytest.mark.skipif(
    not registry.loaded, reason=f"model artifacts unavailable: {registry.load_errors}"
)


HEALTHY_PROJECT = {
    "project_id": "PRJ-2024-001",
    "project_name": "Test Expressway",
    "approved_cost": 4200.0,
    "revised_cost": 5100.0,
    "current_expenditure": 2600.0,
    "physical_progress": 0.42,
    "financial_progress": 0.55,
    "milestones_planned": 24,
    "milestones_delayed": 6,
    "elapsed_duration_months": 30.0,
    "remaining_duration_months": 22.0,
}

STALLED_PROJECT = {
    "project_id": "PRJ-2024-099",
    "project_name": "Stalled Water Project",
    "approved_cost": 900.0,
    "revised_cost": 1450.0,
    "current_expenditure": 880.0,
    "physical_progress": 0.15,
    "financial_progress": 0.62,
    "milestones_planned": 20,
    "milestones_delayed": 15,
    "elapsed_duration_months": 26.0,
    "remaining_duration_months": 14.0,
}


def test_health_reports_loaded_models():
    body = client.get("/health").json()
    assert body["status"] in {"ok", "degraded"}
    assert body["model_version"] == MODEL_VERSION
    assert "available_targets" in body


def test_root_lists_every_endpoint():
    body = client.get("/").json()
    assert body["model_version"] == MODEL_VERSION
    assert any(item.endswith("/ml/predict/full") for item in body["endpoints"])


@requires_models
def test_all_three_targets_are_loaded():
    body = client.get("/health").json()
    assert body["models_loaded"] is True
    assert set(body["available_targets"]) == {
        "cost_overrun_risk",
        "time_overrun_risk",
        "overall_risk_score",
    }
    assert body["missing_targets"] == []


@requires_models
def test_time_prediction_returns_a_real_number_not_an_error():
    response = client.post("/ml/predict/time", json=STALLED_PROJECT)
    assert response.status_code == 200
    body = response.json()
    assert "error" not in body
    assert 0.0 <= body["time_overrun_probability"] <= 1.0
    assert body["predicted_delay_months"] > 0
    assert body["delay_threshold_months"] == DELAY_THRESHOLD_MONTHS


@requires_models
def test_risk_prediction_returns_score_and_band():
    body = client.post("/ml/predict/risk", json=HEALTHY_PROJECT).json()
    assert "error" not in body
    assert 0.0 <= body["overall_risk_score"] <= 100.0
    assert body["risk_level"] in {"LOW", "MEDIUM", "HIGH", "CRITICAL"}


@requires_models
def test_stalled_project_scores_higher_than_healthy_project():
    healthy = client.post("/ml/predict/risk", json=HEALTHY_PROJECT).json()["overall_risk_score"]
    stalled = client.post("/ml/predict/risk", json=STALLED_PROJECT).json()["overall_risk_score"]
    assert stalled > healthy


@requires_models
def test_cost_prediction_is_a_probability():
    body = client.post("/ml/predict/cost", json=STALLED_PROJECT).json()
    assert "error" not in body
    assert 0.0 <= body["cost_overrun_risk_probability"] <= 1.0
    assert body["prediction"] in {0, 1}


@requires_models
def test_legacy_cost_payload_still_works():
    response = client.post(
        "/ml/predict/cost-legacy",
        json={
            "Budget": 1500.0,
            "MaterialCost": 400.0,
            "LaborCost": 300.0,
            "EquipmentCost": 200.0,
            "progress_pct": 0.6,
        },
    )
    assert response.status_code == 200
    assert 0.0 <= response.json()["cost_overrun_risk_probability"] <= 1.0


@requires_models
def test_explain_returns_ranked_shap_factors():
    body = client.post("/ml/explain", json=STALLED_PROJECT).json()
    assert body["top_factors"]
    values = [abs(f["shap_value"]) for f in body["top_factors"]]
    assert values == sorted(values, reverse=True)
    for factor in body["top_factors"]:
        assert factor["impact_direction"] in {"INCREASES_RISK", "DECREASES_RISK"}
        assert factor["description"]


@requires_models
def test_schedule_explanation_is_available():
    body = client.post("/ml/explain/schedule", json=STALLED_PROJECT).json()
    assert body["top_factors"]
    assert body["disclaimer"]


@requires_models
def test_full_prediction_bundles_every_target():
    body = client.post("/ml/predict/full", json=STALLED_PROJECT).json()
    for section in ("cost", "time", "risk", "explanation"):
        assert section in body
    assert body["model_version"] == MODEL_VERSION
    assert body["explanation"]["top_factors"]


@requires_models
def test_model_performance_endpoint_exposes_experiments():
    body = client.get("/model-performance").json()
    assert set(body["targets"]) == {"cost_overrun_risk", "time_overrun_risk", "overall_risk_score"}
    assert body["experiments"]["cost_overrun_risk"]
    assert body["global_feature_importance"]
    assert body["limitations"]


@requires_models
def test_feature_catalogue_documents_every_feature():
    body = client.get("/features").json()
    assert len(body["cost"]["descriptions"]) == len(body["cost"]["features"])
    assert len(body["schedule"]["descriptions"]) == len(body["schedule"]["features"])


def test_invalid_payload_is_rejected_with_422():
    response = client.post("/ml/predict/full", json={"approved_cost": -5})
    assert response.status_code == 422


def test_unknown_field_is_rejected():
    response = client.post(
        "/ml/predict/full", json={**HEALTHY_PROJECT, "unexpected_field": "boom"}
    )
    assert response.status_code == 422
