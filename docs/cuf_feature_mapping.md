# CUF Feature Mapping

This document outlines the features from the dataset that correspond to Core Unified Features (CUF) in infrastructure monitoring.

## Experiment A: CUF-ONLY / BASELINE FEATURES

| Dataset Column | Treated as CUF Concept | Reason |
| :--- | :--- | :--- |
| `Budget` | Approved/Original Cost | Fundamental baseline for any project monitoring. |
| `MaterialCost` | Current Expenditure (Materials) | Represents financial progress. |
| `LaborCost` | Current Expenditure (Labor) | Represents financial progress. |
| `EquipmentCost` | Current Expenditure (Equipment) | Represents financial progress. |

*Note: Since the dataset is extremely limited (no sector, ministry, or physical progress), these are the only viable CUF baseline features.*

## Experiment B: ENHANCED FEATURES

In addition to the CUF features, we engineer the following features:

- `TotalCurrentExpenditure`: `MaterialCost` + `LaborCost` + `EquipmentCost`
- `ExpenditureToBudgetRatio`: `TotalCurrentExpenditure` / `Budget`

These represent enhanced analytical signals derived strictly from information available prior to the final outcome.
