"""Pydantic request/response contracts for the InfraWatch ML API.

These live in `app/schemas.py` rather than inline in `app/main.py` so the Spring
Boot client has a single, versioned contract to mirror.
"""

from __future__ import annotations

from typing import Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class ApiModel(BaseModel):
    """Base for all contracts.

    `protected_namespaces` is cleared so response fields may be named
    `model_version` / `model_name` without shadowing Pydantic's own `model_*`
    namespace.
    """

    model_config = ConfigDict(protected_namespaces=())


class ProjectFeaturesRequest(ApiModel):
    """Full monitoring snapshot for a single project.

    Every field maps to something the Spring Boot backend can derive from
    `projects`, `project_monthly_data` and `milestones`. Nothing here has to be
    invented by the caller.
    """

    model_config = ConfigDict(extra="forbid")

    project_id: Optional[str] = Field(default=None, description="Project code, for logging only.")
    project_name: Optional[str] = None

    approved_cost: float = Field(gt=0, description="Original sanction, INR crore.")
    revised_cost: float = Field(ge=0, description="Current sanctioned cost, INR crore.")
    current_expenditure: float = Field(ge=0, description="Cumulative spend, INR crore.")

    physical_progress: float = Field(default=0.0, ge=0.0, le=1.0)
    financial_progress: float = Field(default=0.0, ge=0.0, le=1.0)

    milestones_planned: int = Field(default=0, ge=0)
    milestones_delayed: int = Field(default=0, ge=0)

    elapsed_duration_months: float = Field(default=0.0, ge=0.0)
    remaining_duration_months: float = Field(default=0.0, ge=0.0)

    material_cost: Optional[float] = Field(default=None, ge=0.0)
    labor_cost: Optional[float] = Field(default=None, ge=0.0)
    equipment_cost: Optional[float] = Field(default=None, ge=0.0)

    sector: Optional[str] = None
    ministry: Optional[str] = None


class CostFeatureRequest(ApiModel):
    """Minimal payload for the cost-overrun model only (backward compatible)."""

    model_config = ConfigDict(extra="ignore")

    Budget: float
    MaterialCost: float
    LaborCost: float
    EquipmentCost: float
    progress_pct: float = 0.5


class CostPredictionResponse(ApiModel):
    cost_overrun_risk_probability: float
    prediction: int
    model_version: str
    model_name: str
    dataset: str


class TimePredictionResponse(ApiModel):
    time_overrun_probability: float
    predicted_delay_months: float
    prediction: int
    delay_threshold_months: float
    model_version: str
    model_name: str
    dataset: str


class RiskPredictionResponse(ApiModel):
    overall_risk_score: float
    risk_level: str
    model_version: str
    model_name: str
    dataset: str


class ShapFactor(BaseModel):
    factor_name: str
    shap_value: float
    impact_direction: str
    description: Optional[str] = None


class ExplanationResponse(ApiModel):
    top_factors: List[ShapFactor]
    global_importance: List[ShapFactor]
    base_value: Optional[float] = None
    disclaimer: str
    model_version: str


class FullPredictionResponse(ApiModel):
    """Single round-trip used by the backend prediction pipeline."""

    cost: CostPredictionResponse
    time: TimePredictionResponse
    risk: RiskPredictionResponse
    explanation: ExplanationResponse
    model_version: str
