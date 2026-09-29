# Master Bug Report

## Issue ID
BUG-001

## Severity
CRITICAL

## Component
Frontend

## Problem
The React application fails to build due to CSS syntax and JS escaping errors.

## Evidence
`npm run build` output:
1. `[vite:css] @import must precede all other statements` (index.css:5)
2. `Expected "]"` in `AiAssistantPage.jsx:14:27`

## Expected Behavior
The frontend builds successfully and compiles into static assets for production deployment.

## Actual Behavior
Vite esbuild throws a syntax error on `AiAssistantPage.jsx` and Vite CSS transformer throws an error on `index.css`. The build process crashes completely.

## Reproduction Steps
1. Navigate to `frontend/`
2. Run `npm ci`
3. Run `npm run build`

## Recommended Fix
1. In `frontend/src/index.css`, move `@import url(...)` to the top of the file, before `@tailwind` directives.
2. In `frontend/src/pages/AiAssistantPage.jsx`, fix the escaping in the string: `'Summarize the project\'s current status.'`

## Status
FIXED / VERIFIED

---

## Issue ID
BUG-002

## Severity
HIGH

## Component
ML Service

## Problem
SHAP Explainer crashes when Logistic Regression is selected as the best model.

## Evidence
`SHAP error: Model type not yet supported by TreeExplainer: <class 'sklearn.linear_model._logistic.LogisticRegression'>` seen during `train_and_evaluate.py` execution.

## Expected Behavior
The ML training pipeline generates SHAP values successfully regardless of the winning model.

## Actual Behavior
The script hardcodes `TreeExplainer`, which crashes on Logistic Regression.

## Reproduction Steps
1. Navigate to `ml-service/`
2. Run `python train_and_evaluate.py`

## Recommended Fix
Update `train_and_evaluate.py` to use `shap.LinearExplainer` if the model is linear, or `shap.Explainer`. (Note: partially mitigated by previous fixes in `app/main.py`, but the training script still errors out at the end).

## Status
FIXED / VERIFIED
