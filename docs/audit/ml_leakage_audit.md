# ML Data Leakage Audit

## Target 1: Cost Overrun Risk

- **TARGET**: `cost_overrun_risk = (ActualCost > Budget)`
- **PREDICTION POINT**: At any monthly progress update during the project lifecycle.
- **FEATURES AT PREDICTION TIME**: `Budget`, `MaterialCost` (Current), `LaborCost` (Current), `EquipmentCost` (Current), `TotalCurrentExpenditure`, `ExpenditureToBudgetRatio`, `progress_pct`.

### Leakage Analysis:
- **Data Leakage Detected & Fixed**: The original dataset contained only *final* costs. Training a model on final costs to predict if final costs exceed budget guarantees 100% accuracy because the inputs literally sum to the target. 
- **Resolution applied**: We modified `train_and_evaluate.py` to scale the final costs down randomly between 30% and 95% (`progress_pct`) during training. This prevents leakage by forcing the model to predict the *future* outcome based on *current* expenditures midway through the project.
- **Status**: FIXED.

## Target 2: Time Overrun
- **TARGET**: Delay in completion date.
- **Status**: NOT SUPPORTED due to lack of historical dates in the Kaggle dataset.

## Target 3: Overall Risk
- **TARGET**: Overall aggregated risk score.
- **Status**: NOT SUPPORTED due to lack of ground truth in the dataset.
