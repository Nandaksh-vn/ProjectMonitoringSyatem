# Data Leakage Review

Before training predictive models for cost overruns, we perform a strict leakage check. 

**Rule**: Do not use any feature that would only be known after the prediction point.

| Feature | Why it might leak | Used in Model? | Reason |
| :--- | :--- | :--- | :--- |
| `ActualCost` | Final outcome variable. Known only at completion. | **No** | Directly leaks the cost overrun status. |
| `Overrun` | The target variable itself (Yes/No). | **No** | Perfectly correlates with the objective. |
| `MaterialCost` | Represents accumulated material cost. | **Yes** (Assuming known during project) | In a real monitoring context, partial expenditures are tracked. (Assuming for this model it represents current state). |
| `LaborCost` | Represents accumulated labor cost. | **Yes** | Same as above. |
| `EquipmentCost` | Represents accumulated equipment cost. | **Yes** | Same as above. |

*Note*: If `MaterialCost`, `LaborCost`, and `EquipmentCost` are *final* values, using them to predict *final* cost overrun is technically leaky for an early-warning system. However, since the dataset lacks temporal snapshots, we treat them as current accumulated expenditures for the purpose of demonstrating the model pipeline, while explicitly dropping the obviously leaked `ActualCost` and `Overrun` from the features.
