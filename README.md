# InfraWatch AI 🏗️

InfraWatch AI is an AI-powered decision-support system for monitoring large infrastructure projects. It uses monthly project data such as physical progress, expenditure, cost, completion dates, and milestones to identify emerging risks. Machine Learning predicts potential cost and schedule overruns, SHAP explains the major factors behind the prediction, and an early-warning engine generates alerts and suggested actions for review. The dashboard allows officials to compare projects across sectors, ministries, and agencies, while a grounded AI assistant provides natural-language project intelligence.

## Problem Statement
Large infrastructure projects often suffer from significant cost and time overruns due to delayed identification of risks. Traditional monitoring is descriptive and backwards-looking. 

InfraWatch AI shifts the paradigm:
**Descriptive Monitoring → Predictive Monitoring → Explainable Monitoring → Prescriptive Decision Support → Early Warning**

## Architecture & Technology Stack
The platform is composed of 3 integrated microservices:
1. **Frontend (React, Vite, TailwindCSS, Recharts)**: A modern, glassmorphism-inspired analytics dashboard.
2. **Backend (Spring Boot, Java 21, MySQL 8.0)**: Handles authentication (JWT), role-based access, API routing, and AI Assistant context grounding.
3. **ML Service (Python, FastAPI, XGBoost, SHAP)**: Provides predictions on cost/time overruns and explains them via SHAP feature importance.

## Key Features
- **Cost/Time Risk Prediction**: Uses an Enhanced Features ML model vs a standard CUF-only baseline to predict overruns.
- **Explainable AI**: SHAP values explicitly show *why* a project is classified as high-risk.
- **Early Warnings**: Rules engine generates actionable alerts based on progress deterioration and cost escalation.
- **AI Project Assistant**: A grounded LLM-style assistant that retrieves factual data, predictions, and recommendations to answer natural language queries securely.

## Demo Flow & Testing
To showcase the platform:
1. **Login** using quick-access demo credentials.
2. Open the **Dashboard** to view project risk distributions and KPI cards.
3. Open a **High-Risk Project** to see the detailed analytics.
4. Show the **Monthly Progress Trend** and **Cost/Time Predictions**.
5. Show **SHAP Risk Factors**, **Early Warning Alerts**, and **Suggested Actions**.
6. Ask the **AI Assistant** "Why is this project high risk?" to demonstrate fact-grounded intelligence.
7. Visit the **Model Performance** page to compare CUF-only vs Enhanced Feature experiments.

## Setup Instructions

### Database Configuration
- **Database Engine**: MySQL 8.0
- **Database Name**: `infrawatchdb`
- **Docker MySQL Host Access**: `localhost:3307`
- **Docker Internal Database Address**: `db:3306`
- **MySQL Workbench Connection**: Host `localhost`, Port `3307`

*Note: H2 is no longer the production/application database. Both Docker deployment and local Spring Boot development use MySQL.*

### Option 1: Local Development
1. **Frontend**: `cd frontend && npm install && npm run dev` (Runs on port 3000)
2. **ML Service**: `cd ml-service && pip install -r requirements.txt && python main.py` (Runs on port 8000)
3. **Backend**: Ensure MySQL is running locally or via Docker on port 3307, then `cd backend && mvn spring-boot:run` (Runs on port 8080)

### Option 2: Docker Deployment (recommended)

Run the deploy script. It is idempotent — safe to run repeatedly, and it takes
about 15 seconds when the Docker layer cache is warm.

```powershell
# Windows
.\deploy.ps1
```

```bash
# Linux / macOS / Git Bash
./deploy.sh
```

The script creates `.env` with a random `JWT_SECRET` if it is missing, builds,
starts, then polls the real endpoints and verifies the seeded login before
reporting success. It exits non-zero and prints the failing service's logs if
anything does not come up.

| Command | Effect |
| --- | --- |
| `.\deploy.ps1` | Build, start, verify. Keeps all data. |
| `.\deploy.ps1 -Fresh` | **Deletes all data** and re-seeds the demo dataset. Asks for confirmation. |
| `.\deploy.ps1 -Fresh -Yes` | Same, without the confirmation prompt (CI). |

Manual equivalent, if you prefer not to use the script:

```bash
docker compose up -d --build
```

Do **not** add `--no-cache` unless you are debugging the build itself; it forces
a full Maven and npm reinstall and turns a 15-second deploy into several minutes.

To wipe the database volume by hand: `docker compose down -v && docker compose up -d`

This starts MySQL (mapped to host 3307), Backend (8080), ML Service (8000), and Frontend (3000).

### Deployment gotcha: never change `DB_PASSWORD` on an existing volume

MySQL only applies `MYSQL_ROOT_PASSWORD` when the volume is **first** created.
Editing `DB_PASSWORD` in `.env` afterwards leaves the database on the old
password while the backend connects with the new one, producing an opaque
`Access denied for user 'root'` on every start. The deploy script detects this
and fails early with an explanation. If it happens, either restore the previous
password or run `.\deploy.ps1 -Fresh` to re-initialise.

## Environment Variables
`.env` is gitignored, so it is absent on every fresh clone. The deploy script
generates it automatically with a random `JWT_SECRET`. To configure it by hand,
copy `.env.example` to `.env` and set at minimum `DB_PASSWORD` and `JWT_SECRET`.
Never commit `.env`.

## Known Limitations & Future Enhancements
- Currently using synthetic demo data for the hackathon presentation.
- Does not claim official integration with MoSPI/PAIMANA unless an actual authorized API integration is completed.
- The AI Assistant uses a simulated LLM endpoint for the demo; in production, this will connect to a secure private LLM via LangChain/Spring AI.

## Important Note
This system **does not** "prevent project delays" or "guarantee cost savings." It **predicts potential risks**, **provides early warnings**, and **supports decision-making** by providing suggested interventions for review.
