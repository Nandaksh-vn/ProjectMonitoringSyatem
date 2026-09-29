# InfraWatch AI - Model Comparison Report

**Model version**: 3.0.0

## Datasets

| Target | Task | Source | Rows | Notes |
|--------|------|--------|------|-------|
| `cost_overrun_risk` | classification | Kaggle (real) | 1000 | Real public dataset. `ActualCost` excluded from features to prevent leakage. |
| `time_overrun_risk` | classification | Synthetic (seeded) | 4000 | SYNTHETIC labels from `generate_schedule_dataset.py` (seeded, reproducible). |
| `overall_risk_score` | regression | Synthetic (seeded) | 4000 | SYNTHETIC labels from `generate_schedule_dataset.py` (seeded, reproducible). |

## Feature Blocks

- **CUF / EXPERIMENT_A**: ['Budget', 'MaterialCost', 'LaborCost', 'EquipmentCost']
- **Enhanced / EXPERIMENT_B**: served configuration, see `app/features.py`

## All Experiment Results

| Target | Experiment | Model | Accuracy | Precision | Recall | F1 | ROC-AUC | MAE | RMSE | R2 |
|---|---|---|---|---|---|---|---|---|---|---|
| cost_overrun_risk | EXPERIMENT_A | Logistic Regression | 0.9500 | 0.8846 | 0.7667 | 0.8214 | 0.9871 | - | - | - |
| cost_overrun_risk | EXPERIMENT_A | Decision Tree | 0.9150 | 0.6970 | 0.7667 | 0.7302 | 0.8633 | - | - | - |
| cost_overrun_risk | EXPERIMENT_A | Random Forest | 0.9550 | 0.8889 | 0.8000 | 0.8421 | 0.9886 | - | - | - |
| cost_overrun_risk | EXPERIMENT_A | XGBoost | 0.9450 | 0.7879 | 0.8667 | 0.8254 | 0.9873 | - | - | - |
| cost_overrun_risk | EXPERIMENT_B | Logistic Regression | 0.9950 | 1.0000 | 0.9667 | 0.9831 | 1.0000 | - | - | - |
| cost_overrun_risk | EXPERIMENT_B | Decision Tree | 0.9750 | 1.0000 | 0.8333 | 0.9091 | 0.9657 | - | - | - |
| cost_overrun_risk | EXPERIMENT_B | Random Forest | 0.9750 | 0.9630 | 0.8667 | 0.9123 | 0.9982 | - | - | - |
| cost_overrun_risk | EXPERIMENT_B | XGBoost | 0.9900 | 0.9667 | 0.9667 | 0.9667 | 0.9998 | - | - | - |
| time_overrun_risk | EXPERIMENT_A | Logistic Regression | 0.8000 | 0.7388 | 0.6534 | 0.6935 | 0.8664 | - | - | - |
| time_overrun_risk | EXPERIMENT_A | Decision Tree | 0.7925 | 0.7558 | 0.5921 | 0.6640 | 0.8355 | - | - | - |
| time_overrun_risk | EXPERIMENT_A | Random Forest | 0.8200 | 0.8182 | 0.6173 | 0.7037 | 0.8791 | - | - | - |
| time_overrun_risk | EXPERIMENT_A | XGBoost | 0.8175 | 0.7673 | 0.6787 | 0.7203 | 0.8740 | - | - | - |
| time_overrun_risk | EXPERIMENT_B | Logistic Regression | 0.8750 | 0.8391 | 0.7906 | 0.8141 | 0.9403 | - | - | - |
| time_overrun_risk | EXPERIMENT_B | Decision Tree | 0.8462 | 0.7674 | 0.7978 | 0.7823 | 0.8907 | - | - | - |
| time_overrun_risk | EXPERIMENT_B | Random Forest | 0.8750 | 0.8417 | 0.7870 | 0.8134 | 0.9539 | - | - | - |
| time_overrun_risk | EXPERIMENT_B | XGBoost | 0.8825 | 0.8280 | 0.8339 | 0.8309 | 0.9557 | - | - | - |
| overall_risk_score | EXPERIMENT_A | Linear Regression | - | - | - | - | - | 11.2915 | 14.0199 | 0.2100 |
| overall_risk_score | EXPERIMENT_A | Decision Tree | - | - | - | - | - | 11.4510 | 14.3694 | 0.1701 |
| overall_risk_score | EXPERIMENT_A | Random Forest | - | - | - | - | - | 10.9243 | 13.4741 | 0.2703 |
| overall_risk_score | EXPERIMENT_A | XGBoost | - | - | - | - | - | 11.1973 | 14.0007 | 0.2121 |
| overall_risk_score | EXPERIMENT_B | Linear Regression | - | - | - | - | - | 6.4228 | 7.8909 | 0.7497 |
| overall_risk_score | EXPERIMENT_B | Decision Tree | - | - | - | - | - | 5.8497 | 7.4608 | 0.7763 |
| overall_risk_score | EXPERIMENT_B | Random Forest | - | - | - | - | - | 5.0206 | 6.3694 | 0.8369 |
| overall_risk_score | EXPERIMENT_B | XGBoost | - | - | - | - | - | 4.9234 | 6.2815 | 0.8414 |

## Selected Models (highest score within EXPERIMENT_B)

- **`cost_overrun_risk`** -> Logistic Regression (LogisticRegression) · Accuracy=0.9950, Precision=1.0000, Recall=0.9667, F1=0.9831, ROC-AUC=1.0000
- **`time_overrun_risk`** -> XGBoost (XGBClassifier) · Accuracy=0.8825, Precision=0.8280, Recall=0.8339, F1=0.8309, ROC-AUC=0.9557
- **`overall_risk_score`** -> XGBoost (XGBRegressor) · MAE=4.9234, RMSE=6.2815, R2=0.8414

## Global Feature Importance (mean |SHAP|)


### `cost_overrun_risk`

| Feature | Mean abs SHAP | Description |
|---|---|---|
| `ExpenditureToBudgetRatio` | 3.1432 | Spend-to-sanction ratio; the core cost-pressure signal. |
| `progress_pct` | 2.6722 | Reported physical completion as a fraction between 0 and 1. |
| `Budget` | 2.0886 | Sanctioned project cost (INR crore). |
| `LaborCost` | 0.3703 | Expenditure on labour to date (INR crore). |
| `TotalCurrentExpenditure` | 0.3179 | Material + labour + equipment spend to date. |
| `MaterialCost` | 0.1965 | Expenditure on materials to date (INR crore). |
| `EquipmentCost` | 0.0550 | Expenditure on equipment to date (INR crore). |

### `time_overrun_risk`

| Feature | Mean abs SHAP | Description |
|---|---|---|
| `DelayedMilestoneRatio` | 2.0422 | Delayed milestones divided by total planned milestones. |
| `ScheduleConsumptionRatio` | 0.9995 | Share of the total duration already consumed. |
| `FinancialProgress` | 0.9423 | Financial completion as a fraction between 0 and 1. |
| `CostGrowthPct` | 0.8592 | Percentage cost revision over the original sanction. |
| `ProgressGap` | 0.6354 | Physical minus financial progress; negative means money is being spent ahead of work. |
| `PhysicalProgress` | 0.4114 | Physical completion as a fraction between 0 and 1. |
| `RemainingDurationMonths` | 0.4113 | Months remaining until the current completion target. |
| `ExpenditureToBudgetRatio` | 0.3152 | Spend-to-sanction ratio. |
| `ElapsedDurationMonths` | 0.2504 | Months elapsed since the scheduled start date. |
| `Budget` | 0.1879 | Sanctioned project cost (INR crore); larger works tolerate more slippage. |

### `overall_risk_score`

| Feature | Mean abs SHAP | Description |
|---|---|---|
| `CostGrowthPct` | 7.8813 | Percentage cost revision over the original sanction. |
| `DelayedMilestoneRatio` | 4.3379 | Delayed milestones divided by total planned milestones. |
| `ScheduleConsumptionRatio` | 1.9328 | Share of the total duration already consumed. |
| `PhysicalProgress` | 1.2426 | Physical completion as a fraction between 0 and 1. |
| `FinancialProgress` | 0.8795 | Financial completion as a fraction between 0 and 1. |
| `ExpenditureToBudgetRatio` | 0.6535 | Spend-to-sanction ratio. |
| `ElapsedDurationMonths` | 0.6195 | Months elapsed since the scheduled start date. |
| `RemainingDurationMonths` | 0.5381 | Months remaining until the current completion target. |
| `ProgressGap` | 0.3836 | Physical minus financial progress; negative means money is being spent ahead of work. |
| `Budget` | 0.3770 | Sanctioned project cost (INR crore); larger works tolerate more slippage. |

## Explainability

SHAP is computed locally per prediction and globally as mean absolute SHAP value. SHAP expresses model association, not proven causation.

## Known Limitations

- `time_overrun_risk` and `overall_risk_score` are trained on **synthetic** schedule labels. The cost dataset contains no date or milestone columns, so no real schedule ground truth was available.
- The cost dataset contains no sector, ministry or geography columns, so those are not model features and are handled by the backend rules engine instead.
- `progress_pct` in the cost experiment is simulated (`np.random.default_rng(42)`) to represent an in-flight project. Re-run the pipeline if the cost dataset is replaced.
- ROC-AUC on the cost target is near-perfect because the spend ratio is close to linearly separable; read it as a sanity check, not a generalisation guarantee.
