# Phase 4 Final Report - Real Dataset Discovery and Training

## 1. Discovered Datasets
Recursively scanning `ml-service/data/raw/` revealed the following datasets:
- **cost_prediction.csv**: Construction Cost Overrun Prediction (1,000 rows, 7 cols).
- **Construction_Data_PM_Forms_All_Projects.csv**: PM Forms data (10,254 rows, 17 cols).
- **Construction_Data_PM_Tasks_All_Projects.csv**: PM Tasks data (12,424 rows, 19 cols).
- **JPF_Anonymised_Project_Data.json**: Huge JSON file containing UK project activities (299 projects parsed to JPF_Projects_Summary.csv).
*(Note: ScienceDirect PDFs were ignored as unrelated files).*

## 2. Dataset Suitability Comparison
- **cost_prediction.csv**: SUPPORTED for Cost Overrun Prediction. Not supported for Time/Risk.
- **PM Forms/Tasks CSVs**: SUPPORTED for Progress Analysis. Not supported for Cost/Time/Risk Prediction (no financial baselines or schedule outcomes).
- **JPF_Anonymised_Project_Data.json**: Not supported for project-level Cost/Time/Risk prediction (contains dates but lacks explicit planned vs actual completion outcomes for the whole project, no cost or risk labels).

*Decision*: Datasets were NOT blindly merged because there is no common project key linking Kaggle datasets with the JPF JSON. 

## 3. Dataset Selected for Each Model
- **Cost Model**: `cost_prediction.csv`
- **Time Model**: None (Insufficient historical data)
- **Risk Model**: None (Historical risk label unavailable)

## 4. Number of Records
- **Cost Model**: 1,000 records.

## 5. Features Used
- **CUF Features**: `Budget`, `MaterialCost`, `LaborCost`, `EquipmentCost`
- **Additional Features**: `TotalCurrentExpenditure`, `ExpenditureToBudgetRatio`

## 6. Target Definitions
- **Cost Overrun Risk**: `ActualCost > Budget` (Binary classification: 1 for Yes, 0 for No). The target `Overrun` and `ActualCost` columns were explicitly excluded from features.
- **Time Overrun**: Unsupported.
- **Overall Risk**: Unsupported.

## 7. Prediction Point
The prediction point is assumed to be during the execution phase, where `MaterialCost`, `LaborCost`, and `EquipmentCost` reflect cumulative expenditures. (Because temporal snapshots are missing, we treat these as current states for the purpose of the model).

## 8. Leakage Analysis
Features strictly excluded from the training input:
- `ActualCost`: Final project outcome.
- `Overrun`: Target label.
- `cost_overrun_pct`: Derived directly from the final outcome.
This ensures the model acts as an early warning system rather than an after-the-fact calculator.

## 9. CUF-only Experiment (Experiment A)
Used only baseline features (`Budget`, `MaterialCost`, `LaborCost`, `EquipmentCost`).

## 10. CUF + Additional Feature Experiment (Experiment B)
Added engineered features `TotalCurrentExpenditure` and `ExpenditureToBudgetRatio`.

## 11. Train/Test Strategy
- **Split**: 80% Train, 20% Test (Stratified Random Split).
- **Temporal Splitting**: Impossible because the dataset contains no chronological data (no dates). Random split was therefore legitimately appropriate.
- **Preprocessing**: `StandardScaler` applied strictly on the training set.

## 12. Class Distribution
Cost overrun risk: 85.1% No Overrun, 14.9% Overrun (imbalanced, handled via stratified split).

## 13. Model Comparison (Experiment B)
| Model | Accuracy | Precision | Recall | F1 | ROC-AUC |
|---|---|---|---|---|---|
| Logistic Regression | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 1.0000 |
| Decision Tree | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 1.0000 |
| Random Forest | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 1.0000 |
| XGBoost | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 1.0000 |

*(The addition of `ExpenditureToBudgetRatio` provides near-perfect linear separability in this specific dataset).*

## 14. Selected Models
- **Cost Overrun**: Logistic Regression (selected for highest performance with simplest interpretability).

## 15. SHAP Results
Implemented via `shap.LinearExplainer` for the selected Logistic Regression model. 
- **Top Risk Factors**: `ExpenditureToBudgetRatio` and `TotalCurrentExpenditure`.
- Explanations explicitly clarify that they show model association, not proven causation.

## 16. Model File Locations
- **Real-Data Models**: `ml-service/models/v2_dataset/best_cost_overrun_risk_model.joblib`
- **Synthetic Models**: Preserved safely in `ml-service/models/v1_synthetic/`

## 17. FastAPI Test Results
Endpoints were successfully updated and tested:
- `GET /health`: OK (v2.0.0)
- `POST /ml/predict/cost`: Returns valid probability and prediction.
- `POST /ml/predict/time`: Gracefully returns "Time-overrun prediction is not supported by the current dataset..."
- `POST /ml/predict/risk`: Gracefully returns "Overall risk prediction is not supported..."
- `POST /ml/explain`: Successfully executes SHAP explanation.

## 18. Limitations
- **Kaggle Data**: These are public Kaggle datasets and are NOT official PAIMANA/MoSPI data.
- **Geographic/Sector Context**: The dataset lacks project identifiers like Sector, Ministry, Location, rendering it difficult to segment risk by domain.

## 19. Additional Data Required
To train the Time-Overrun and Overall-Risk models, new historical datasets are strictly required containing:
- Baseline planned completion dates vs actual completion dates.
- Formalized historical risk scores or labels.
