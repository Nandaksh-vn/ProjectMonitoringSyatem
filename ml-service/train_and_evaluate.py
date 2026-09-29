"""Offline training and evaluation pipeline for InfraWatch.

Trains three independent targets and selects the winner for each by ROC-AUC
(classification) or R2 (regression):

    cost_overrun_risk     binary      real Kaggle dataset
    time_overrun_risk     binary      synthetic schedule dataset (see generator)
    overall_risk_score    regression  synthetic schedule dataset (see generator)

Two feature experiments are run for every target so the value of the engineered
features can be measured rather than asserted:

    EXPERIMENT_A  Cost Uniform Format (CUF) block only
    EXPERIMENT_B  CUF + engineered monitoring features (the served configuration)

Artifacts land in `models/v3_full/` and the human-readable comparison table is
written to `model_comparison_report.md`.

USAGE
-----
    python train_and_evaluate.py
"""

from __future__ import annotations

import json
import os
from typing import Dict, List, Tuple

import joblib
import numpy as np
import pandas as pd
import shap
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    mean_absolute_error,
    mean_squared_error,
    precision_score,
    r2_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor
from xgboost import XGBClassifier, XGBRegressor

from app.features import (
    COST_BLOCK_DESCRIPTION,
    COST_FEATURE_NAMES,
    SCHEDULE_BLOCK_DESCRIPTION,
    SCHEDULE_FEATURE_NAMES,
    build_cost_features,
    build_schedule_features,
)

COST_DATASET = os.path.join("data", "raw", "cost_prediction.csv")
SCHEDULE_DATASET = os.path.join("data", "raw", "schedule_prediction.csv")
MODEL_OUT_DIR = os.path.join("models", "v3_full")
REPORT_PATH = "model_comparison_report.md"
METRICS_PATH = os.path.join(MODEL_OUT_DIR, "metrics.json")
MODEL_VERSION = "3.0.0"

CLASSIFIERS = {
    "Logistic Regression": lambda: LogisticRegression(max_iter=1000, random_state=42),
    "Decision Tree": lambda: DecisionTreeClassifier(max_depth=6, random_state=42),
    "Random Forest": lambda: RandomForestClassifier(n_estimators=300, max_depth=8, random_state=42),
    "XGBoost": lambda: XGBClassifier(
        n_estimators=300, max_depth=5, learning_rate=0.08, eval_metric="logloss", random_state=42
    ),
}

REGRESSORS = {
    "Linear Regression": lambda: LinearRegression(),
    "Decision Tree": lambda: DecisionTreeRegressor(max_depth=6, random_state=42),
    "Random Forest": lambda: RandomForestRegressor(n_estimators=300, max_depth=8, random_state=42),
    "XGBoost": lambda: XGBRegressor(
        n_estimators=300, max_depth=5, learning_rate=0.08, eval_metric="rmse", random_state=42
    ),
}


def load_cost_dataset() -> Tuple[pd.DataFrame, List[str], List[str]]:
    if not os.path.exists(COST_DATASET):
        raise FileNotFoundError(
            f"{COST_DATASET} not found. The cost model is trained on a real dataset and cannot be synthesised."
        )
    df = pd.read_csv(COST_DATASET)

    df["cost_overrun_risk"] = (df["ActualCost"] > df["Budget"]).astype(int)

    rng = np.random.default_rng(42)
    df["progress_pct"] = rng.uniform(0.3, 0.95, len(df))

    df["MaterialCost"] = df["MaterialCost"] * df["progress_pct"]
    df["LaborCost"] = df["LaborCost"] * df["progress_pct"]
    df["EquipmentCost"] = df["EquipmentCost"] * df["progress_pct"]

    df["TotalCurrentExpenditure"] = df["MaterialCost"] + df["LaborCost"] + df["EquipmentCost"]
    df["ExpenditureToBudgetRatio"] = df["TotalCurrentExpenditure"] / df["Budget"].replace(0, 1)

    experiment_a = COST_FEATURE_NAMES[:4]
    experiment_b = COST_FEATURE_NAMES
    return df, experiment_a, experiment_b


def load_schedule_dataset() -> Tuple[pd.DataFrame, List[str], List[str]]:
    if not os.path.exists(SCHEDULE_DATASET):
        raise FileNotFoundError(
            f"{SCHEDULE_DATASET} not found. Run `python generate_schedule_dataset.py` first."
        )
    df = pd.read_csv(SCHEDULE_DATASET)

    def col(name: str) -> np.ndarray:
        return df[name].to_numpy(dtype=float)

    cost_features = build_cost_features(
        budget=col("approved_cost"),
        material_cost=col("current_expenditure") * 0.52,
        labor_cost=col("current_expenditure") * 0.31,
        equipment_cost=col("current_expenditure") * 0.17,
        progress_pct=col("physical_progress"),
    )
    frame = pd.DataFrame(cost_features)

    schedule = build_schedule_features(
        approved_cost=col("approved_cost"),
        revised_cost=col("revised_cost"),
        current_expenditure=col("current_expenditure"),
        physical_progress=col("physical_progress"),
        financial_progress=col("financial_progress"),
        milestones_planned=df["milestones_planned"].to_numpy(dtype=int),
        milestones_delayed=df["milestones_delayed"].to_numpy(dtype=int),
        elapsed_duration_months=col("elapsed_duration_months"),
        remaining_duration_months=col("remaining_duration_months"),
    )
    for name in SCHEDULE_FEATURE_NAMES:
        frame[name] = schedule[name]

    for target_col in ("time_overrun_risk", "overall_risk_score", "delay_months", "sector_code"):
        if target_col in df.columns:
            frame[target_col] = df[target_col].to_numpy()

    experiment_a = [
        "Budget",
        "PhysicalProgress",
        "FinancialProgress",
        "ElapsedDurationMonths",
        "RemainingDurationMonths",
    ]
    experiment_b = SCHEDULE_FEATURE_NAMES
    return frame, experiment_a, experiment_b


def evaluate_classifier(name: str, model, y_true, y_pred, y_proba) -> Dict[str, float]:
    return {
        "Accuracy": accuracy_score(y_true, y_pred),
        "Precision": precision_score(y_true, y_pred, zero_division=0),
        "Recall": recall_score(y_true, y_pred, zero_division=0),
        "F1": f1_score(y_true, y_pred, zero_division=0),
        "ROC-AUC": roc_auc_score(y_true, y_proba),
    }


def evaluate_regressor(name: str, model, y_true, y_pred) -> Dict[str, float]:
    return {
        "MAE": mean_absolute_error(y_true, y_pred),
        "RMSE": float(np.sqrt(mean_squared_error(y_true, y_pred))),
        "R2": r2_score(y_true, y_pred),
    }


def _make_explainer(model, background: np.ndarray):
    class_name = type(model).__name__
    if "Linear" in class_name or "Logistic" in class_name:
        return shap.LinearExplainer(model, background)
    return shap.TreeExplainer(model)


def _extract_shap_row(explainer, matrix: np.ndarray) -> np.ndarray:
    values = explainer.shap_values(matrix)
    if isinstance(values, list):
        values = values[-1]
    values = np.asarray(values)
    if values.ndim == 3:
        return values[:, :, -1][0]
    return values[0]


def train_target(
    target: str,
    df: pd.DataFrame,
    experiment_a: List[str],
    experiment_b: List[str],
    task: str,
    dataset_label: str,
    feature_descriptions: Dict[str, str],
) -> Tuple[Dict, Dict, List[Dict]]:
    results: List[Dict] = []
    selected: Dict = {}
    y = df[target].values

    for exp_name, features in (("EXPERIMENT_A", experiment_a), ("EXPERIMENT_B", experiment_b)):
        X = df[features]
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y if task == "classification" else None
        )

        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)

        candidates = CLASSIFIERS if task == "classification" else REGRESSORS
        best_score = -np.inf
        best_name = ""
        best_obj = None
        best_metrics: Dict[str, float] = {}

        for model_name, factory in candidates.items():
            model = factory()
            model.fit(X_train_scaled, y_train)
            preds = model.predict(X_test_scaled)

            if task == "classification":
                proba = model.predict_proba(X_test_scaled)[:, 1]
                metrics = evaluate_classifier(model_name, model, y_test, preds, proba)
                score = metrics["ROC-AUC"]
            else:
                metrics = evaluate_regressor(model_name, model, y_test, preds)
                score = metrics["R2"]

            results.append(
                {
                    "target": target,
                    "task": task,
                    "dataset": dataset_label,
                    "experiment": exp_name,
                    "model": model_name,
                    **{k: float(v) for k, v in metrics.items()},
                }
            )

            if exp_name == "EXPERIMENT_B" and score > best_score:
                best_score, best_name, best_obj, best_metrics = score, model_name, model, metrics

        if exp_name != "EXPERIMENT_B":
            continue

        joblib.dump(best_obj, os.path.join(MODEL_OUT_DIR, f"best_{target}_model.joblib"))
        joblib.dump(scaler, os.path.join(MODEL_OUT_DIR, f"scaler_{target}.joblib"))

        global_importance = []
        try:
            explainer = _make_explainer(best_obj, X_train_scaled)
            shap_values = explainer.shap_values(X_train_scaled)
            if isinstance(shap_values, list):
                shap_values = shap_values[-1]
            mean_abs = np.abs(np.asarray(shap_values)).mean(axis=0)
            for name, value in zip(experiment_b, mean_abs):
                global_importance.append(
                    {"feature": name, "mean_abs_shap": float(value), "description": feature_descriptions.get(name, "")}
                )
            global_importance.sort(key=lambda item: item["mean_abs_shap"], reverse=True)
        except Exception as exc:  # pragma: no cover - diagnostic path
            print(f"  SHAP global importance failed for {target}: {exc}")

        row = _extract_shap_row(_make_explainer(best_obj, X_train_scaled[:1]), X_test_scaled[:1])

        selected[target] = {
            "model": best_name,
            "task": task,
            "model_class": type(best_obj).__name__,
            "model_version": MODEL_VERSION,
            "dataset": dataset_label,
            "feature_names": experiment_b,
            "feature_descriptions": feature_descriptions,
            "metrics": {k: float(v) for k, v in best_metrics.items()},
            "global_feature_importance": global_importance,
            "local_shap_reference": {n: float(v) for n, v in zip(experiment_b, row)},
            "n_train": int(len(X_train)),
            "n_test": int(len(X_test)),
        }

    return selected, best_metrics, results


def main() -> None:
    os.makedirs(MODEL_OUT_DIR, exist_ok=True)

    selected: Dict = {}
    all_results: List[Dict] = []

    cost_df, cost_a, cost_b = load_cost_dataset()
    print(f"Cost dataset: {len(cost_df)} rows, overrun rate {cost_df['cost_overrun_risk'].mean():.3f}")
    sel, _, res = train_target(
        "cost_overrun_risk", cost_df, cost_a, cost_b, "classification", "Kaggle (real)", COST_BLOCK_DESCRIPTION
    )
    selected.update(sel)
    all_results.extend(res)

    schedule_df, sched_a, sched_b = load_schedule_dataset()
    print(
        f"Schedule dataset: {len(schedule_df)} rows, "
        f"slip rate {schedule_df['time_overrun_risk'].mean():.3f}"
    )
    for target, task, descriptions in (
        ("time_overrun_risk", "classification", SCHEDULE_BLOCK_DESCRIPTION),
        ("overall_risk_score", "regression", SCHEDULE_BLOCK_DESCRIPTION),
    ):
        sel, _, res = train_target(
            target, schedule_df, sched_a, sched_b, task, "Synthetic (seeded)", descriptions
        )
        selected.update(sel)
        all_results.extend(res)

    payload = {
        "model_version": MODEL_VERSION,
        "trained_at": pd.Timestamp.utcnow().isoformat(),
        "targets": selected,
        "all_experiments": all_results,
    }
    with open(METRICS_PATH, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2)

    _write_report(selected, all_results)
    print(f"\nArtifacts written to {MODEL_OUT_DIR}/ and {METRICS_PATH}")
    print(f"Report written to {REPORT_PATH}")


def _write_report(selected: Dict, all_results: List[Dict]) -> None:
    lines: List[str] = []
    lines.append("# InfraWatch AI - Model Comparison Report\n")
    lines.append(f"**Model version**: {MODEL_VERSION}\n")

    lines.append("## Datasets\n")
    lines.append("| Target | Task | Source | Rows | Notes |")
    lines.append("|--------|------|--------|------|-------|")
    notes = {
        "cost_overrun_risk": "Real public dataset. `ActualCost` excluded from features to prevent leakage.",
        "time_overrun_risk": "SYNTHETIC labels from `generate_schedule_dataset.py` (seeded, reproducible).",
        "overall_risk_score": "SYNTHETIC labels from `generate_schedule_dataset.py` (seeded, reproducible).",
    }
    for target, meta in selected.items():
        lines.append(
            f"| `{target}` | {meta['task']} | {meta['dataset']} | {meta['n_train'] + meta['n_test']} | {notes.get(target, '')} |"
        )

    lines.append("\n## Feature Blocks\n")
    lines.append(f"- **CUF / EXPERIMENT_A**: {COST_FEATURE_NAMES[:4]}")
    lines.append(f"- **Enhanced / EXPERIMENT_B**: served configuration, see `app/features.py`")

    lines.append("\n## All Experiment Results\n")
    lines.append("| Target | Experiment | Model | Accuracy | Precision | Recall | F1 | ROC-AUC | MAE | RMSE | R2 |")
    lines.append("|---|---|---|---|---|---|---|---|---|---|---|")
    for row in all_results:
        def fmt(key: str) -> str:
            return f"{row[key]:.4f}" if key in row else "-"

        lines.append(
            f"| {row['target']} | {row['experiment']} | {row['model']} | {fmt('Accuracy')} | "
            f"{fmt('Precision')} | {fmt('Recall')} | {fmt('F1')} | {fmt('ROC-AUC')} | "
            f"{fmt('MAE')} | {fmt('RMSE')} | {fmt('R2')} |"
        )

    lines.append("\n## Selected Models (highest score within EXPERIMENT_B)\n")
    for target, meta in selected.items():
        metric_text = ", ".join(f"{k}={v:.4f}" for k, v in meta["metrics"].items())
        lines.append(f"- **`{target}`** -> {meta['model']} ({meta['model_class']}) · {metric_text}")

    lines.append("\n## Global Feature Importance (mean |SHAP|)\n")
    for target, meta in selected.items():
        lines.append(f"\n### `{target}`\n")
        lines.append("| Feature | Mean abs SHAP | Description |")
        lines.append("|---|---|---|")
        for item in meta["global_feature_importance"]:
            lines.append(f"| `{item['feature']}` | {item['mean_abs_shap']:.4f} | {item['description']} |")

    lines.append("\n## Explainability\n")
    lines.append(
        "SHAP is computed locally per prediction and globally as mean absolute SHAP value. "
        "SHAP expresses model association, not proven causation."
    )

    lines.append("\n## Known Limitations\n")
    lines.append(
        "- `time_overrun_risk` and `overall_risk_score` are trained on **synthetic** schedule labels. "
        "The cost dataset contains no date or milestone columns, so no real schedule ground truth was available."
    )
    lines.append(
        "- The cost dataset contains no sector, ministry or geography columns, so those are not model features "
        "and are handled by the backend rules engine instead."
    )
    lines.append(
        "- `progress_pct` in the cost experiment is simulated (`np.random.default_rng(42)`) to represent "
        "an in-flight project. Re-run the pipeline if the cost dataset is replaced."
    )
    lines.append("- ROC-AUC on the cost target is near-perfect because the spend ratio is close to linearly separable; read it as a sanity check, not a generalisation guarantee.")

    with open(REPORT_PATH, "w", encoding="utf-8") as handle:
        handle.write("\n".join(lines) + "\n")


if __name__ == "__main__":
    main()
