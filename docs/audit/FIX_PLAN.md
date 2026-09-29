# Fix Plan

## Priority 1: CRITICAL

### 1. Fix Frontend Build Crash
- **Problem**: React app cannot be built, blocking deployment entirely.
- **Impact**: CRITICAL. No user interface can be deployed.
- **File**: `frontend/src/index.css` & `frontend/src/pages/AiAssistantPage.jsx`
- **Recommended change**: 
  - Move `@import` to line 1 in `index.css`.
  - Fix string escaping in `AiAssistantPage.jsx` (remove extra slash or use double quotes).
- **Risk of change**: LOW. Safe syntactic fixes.

## Priority 2: HIGH

### 2. Fix SHAP Explainer Crash in ML Training
- **Problem**: `train_and_evaluate.py` crashes on SHAP generation for Logistic Regression.
- **Impact**: HIGH. Training pipeline doesn't fully complete its explainability step.
- **File**: `ml-service/train_and_evaluate.py`
- **Recommended change**: Use `shap.LinearExplainer` or `shap.Explainer` conditionally.
- **Risk of change**: LOW.

## Priority 3: MEDIUM
### 3. Move Hardcoded Credentials to Environment
- **Problem**: Possible hardcoded database and JWT secrets.
- **Impact**: MEDIUM. Security risk.
- **File**: `backend/src/main/resources/application.properties`
- **Recommended change**: Reference `${DB_PASSWORD}` and `${JWT_SECRET}`.
- **Risk of change**: LOW.
