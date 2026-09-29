# InfraWatch AI - Model Comparison Report

## Dataset
- **Source**: Kaggle (Construction Cost Overrun Prediction Dataset)
- **Note**: Dataset is from Kaggle and is not official PAIMANA/OCMS data.
- **Size**: 1000 records
- **Train/Test Strategy**: Stratified Random Split (80/20) - Used because no temporal/date columns are present.

## Feature Lists
**CUF Features (Experiment A):**
['Budget', 'MaterialCost', 'LaborCost', 'EquipmentCost']

**Additional Engineered Features (Experiment B):**
['Budget', 'MaterialCost', 'LaborCost', 'EquipmentCost', 'TotalCurrentExpenditure', 'ExpenditureToBudgetRatio', 'progress_pct']

## Target Definitions
- **Cost Overrun Risk**: Binary classification (1 if ActualCost > Budget, else 0).

## Model Metrics

| Target | Experiment | Model | Accuracy | Precision | Recall | F1 | ROC-AUC |
|--------|------------|-------|----------|-----------|--------|----|---------|
| cost_overrun_risk | EXPERIMENT_A | Logistic Regression | 0.9400 | 0.8000 | 0.8000 | 0.8000 | 0.9798 |
| cost_overrun_risk | EXPERIMENT_A | Decision Tree | 0.9400 | 0.8000 | 0.8000 | 0.8000 | 0.9125 |
| cost_overrun_risk | EXPERIMENT_A | Random Forest | 0.9600 | 0.9231 | 0.8000 | 0.8571 | 0.9865 |
| cost_overrun_risk | EXPERIMENT_A | XGBoost | 0.9400 | 0.7812 | 0.8333 | 0.8065 | 0.9871 |
| cost_overrun_risk | EXPERIMENT_B | Logistic Regression | 0.9950 | 1.0000 | 0.9667 | 0.9831 | 1.0000 |
| cost_overrun_risk | EXPERIMENT_B | Decision Tree | 0.9650 | 0.8710 | 0.9000 | 0.8852 | 0.9360 |
| cost_overrun_risk | EXPERIMENT_B | Random Forest | 0.9550 | 0.9200 | 0.7667 | 0.8364 | 0.9957 |
| cost_overrun_risk | EXPERIMENT_B | XGBoost | 0.9950 | 0.9677 | 1.0000 | 0.9836 | 0.9992 |
\n## Selected Models (Experiment B)\n- **cost_overrun_risk**: Logistic Regression\n
## SHAP Implementation
SHAP (SHapley Additive exPlanations) is implemented using the final trained Tree-based model to show global feature importance and contribution direction. SHAP explains model contribution/association. It does NOT prove causation.

## Limitations
- **Time Overrun**: Not supported (no historical completion dates available).
- **Overall Risk**: Not supported (no overall risk ground truth available).
- **Project Context**: Dataset lacks metadata like sector, ministry, or geographic location.

## Model Version
Version 2.0.0 based on Kaggle real dataset.
