# Dataset Mapping

**Dataset Name**: Construction Cost Overrun Prediction Dataset
**Kaggle Source**: https://www.kaggle.com/sakshibhosale1904/construction-cost-overrun-prediction-dataset
**Number of Records**: 1000

## Column Mappings

| Dataset Column | InfraWatch Concept | Type | Use |
| :--- | :--- | :--- | :--- |
| Project_ID | Project Identifier | Categorical | ID only, not used for modeling |
| Budget | Approved/Original Cost | Numerical | Baseline financial metric |
| ActualCost | Revised/Final Cost | Numerical | Post-outcome target variable (Do NOT use as feature) |
| MaterialCost | Expenditure - Materials | Numerical | Feature |
| LaborCost | Expenditure - Labor | Numerical | Feature |
| EquipmentCost | Expenditure - Equipment | Numerical | Feature |
| Overrun | Cost Overrun Indicator | Categorical | Leaked Target (Do NOT use as feature) |

## Limitations
- **This Kaggle dataset is NOT official PAIMANA/MoSPI data.**
- **Time Overrun**: The dataset contains no schedule or completion date information. Therefore, time-overrun prediction is **not supported** by this dataset.
- **Overall Risk**: The dataset contains no overall risk score. We will not fabricate an overall risk ground truth.
- **Project Context**: The dataset lacks metadata like Sector, Ministry, or Location.
