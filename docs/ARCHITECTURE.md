# InfraWatch AI Architecture Documentation

## Target Infrastructure Domain
Monitors Central Sector Infrastructure Projects across 17 Central Ministries and 22 Infrastructure Sectors (Transport & Logistics, Energy, Water & Sanitation, Communication, Social Infrastructure, Coal, Steel, Mining).

## System Lifecycle Loop
```
MONITOR ──► ANALYZE ──► PREDICT ──► EXPLAIN ──► RECOMMEND ──► ALERT ──► MONITOR AGAIN
```

## System Components
1. **React Frontend**: Single Page Application (SPA) serving dashboards, early warning alert feeds, and interactive project intelligence interfaces.
2. **Spring Boot Backend**: Central orchestrator providing REST API services, RBAC security, DB persistence, and context aggregation for LLM / ML requests.
3. **Python FastAPI ML Service**: Performs classification and regression inference (Logistic Regression, Decision Trees, Random Forest, XGBoost), feature engineering, and SHAP explainability.
4. **MySQL Database**: Central repository for project master records, monthly CUF progress snapshots, and analytics data.
