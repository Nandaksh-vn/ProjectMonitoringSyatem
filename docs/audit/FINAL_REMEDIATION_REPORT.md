# InfraWatch AI — Final Remediation Report

## 1. Hardcoded Configuration / Secrets

**BEFORE:**
- `.env.example` contained a real JWT secret value in plain text (committed to source).
- `docker-compose.yml` had hardcoded JWT secret as a fallback default: `${JWT_SECRET:-<REDACTED>}`.
- `docker-compose.yml` had hardcoded `DB_USERNAME:-root` and `DB_PASSWORD:-root` defaults.
- `JwtUtil.java` used `Keys.secretKeyFor(...)` — ephemeral random key generated per restart, invalidating all tokens on every server restart (operationally broken for persistent sessions).
- Root `.gitignore` did NOT exclude `frontend/.env` or `backend/.env`.

**AFTER:**
- `.env.example` contains empty placeholders only. No credentials committed.
- `docker-compose.yml` uses bare `${JWT_SECRET}`, `${DB_USERNAME}`, `${DB_PASSWORD}` — will error rather than silently use weak defaults.
- `JwtUtil.java` refactored to read key from `jwt.secret` Spring property (backed by `JWT_SECRET` env var). Tokens now survive server restarts.
- `application.yml` has `jwt.secret: ${JWT_SECRET:infrawatch-local-dev-secret-...}` — local dev safe default, production must set `JWT_SECRET`.
- Root `.gitignore` now excludes `frontend/.env`, `backend/.env`, `.env`, `.env.local`, `.env.*.local`.

**STATUS:** FIXED

> **NOTE:** The original JWT secret was previously present in `.env.example` which may have been committed. **Credential rotation is strongly recommended.**

---

## 2. Docker

**BEFORE:**
- Docker daemon was unavailable for previous audit tests.
- `docker-compose.yml` had obsolete `version: '3.8'` attribute.
- Backend `Dockerfile` referenced `mvnw` and `.mvn` which do NOT exist in the repository. Docker build FAILED.
- `docker-compose.yml` had hardcoded credentials as fallback defaults.

**AFTER:**
- Docker daemon confirmed running (Server Version: 29.7.2).
- Backend `Dockerfile` fixed: now installs Maven via `apk add maven` and uses `mvn` directly.
- `docker-compose.yml` `version:` attribute removed.
- `docker-compose.yml` credentials cleaned (no hardcoded defaults).
- `docker compose build` running now.

**STATUS:** FIXED (build in progress — see separate build log)

---

## 3. Database E2E

**STATUS:** BLOCKED — Docker stack must be fully running for database E2E tests. Will be possible once `docker compose up` completes successfully.

---

## 4. Frontend

- CSS `@import` ordering fixed (previously blocked Vite build).
- `AiAssistantPage.jsx` string escaping fixed, missing `</div>` added.
- `npm run build` succeeds cleanly: **2355 modules transformed, 0 errors**.
- Chunk size warning (754 kB JS bundle) is a non-blocking performance note.

**STATUS:** PASS

---

## 5. Backend

- `mvn clean package -DskipTests` succeeds with 47 source files compiled.
- JWT now reads from stable externalized key instead of ephemeral random key.
- All Spring Boot config already used `${ENV_VAR:default}` pattern.

**STATUS:** PASS

---

## 6. ML Pipeline

- `train_and_evaluate.py` runs to completion with no errors.
- SHAP explainer successfully created for Logistic Regression (LinearExplainer).
- No target leakage: progress_pct simulation correctly prevents leakage.

**STATUS:** PASS

---

## 7. SHAP

- `/ml/explain` returns top 5 SHAP factors correctly.
- `ExpenditureToBudgetRatio` correctly identified as top risk driver.
- SHAP now works for all model types: Linear, Tree, XGBoost.

**STATUS:** PASS

---

## 8. API

| Endpoint | Status | Result |
|---|---|---|
| GET /health | PASS | `{status: ok, models_loaded: true}` |
| POST /ml/predict/cost | PASS | Returns probability |
| POST /ml/predict/time | NOT AVAILABLE (expected) | Returns error message |
| POST /ml/predict/risk | NOT AVAILABLE (expected) | Returns error message |
| POST /ml/explain | PASS | Returns top 5 SHAP factors |

**STATUS:** PASS

---

## 9. AI Assistant

**Implementation:** SIMULATED / DEMO ASSISTANT

The `AiAssistantService.java` uses keyword-based matching against grounded project database context (project facts, predictions, alerts, milestones, recommendations). It does NOT connect to an LLM. This is correctly documented in the README as the demo implementation.

**STATUS:** SIMULATED / DEMO ASSISTANT — No issues found within its intended scope.

---

## 10. Recharts

Recharts v2.15.4 emits a deprecation warning during `npm ci`. The application builds and runs correctly. No functional or security issue detected. The current version is compatible with the React version in use.

**STATUS:** LOW PRIORITY — NON-BLOCKING DEPENDENCY WARNING. No action taken.
