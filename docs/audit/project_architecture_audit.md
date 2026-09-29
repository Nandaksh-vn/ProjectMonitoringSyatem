# Project Architecture Audit

## 1. Frontend
- **Framework**: React with Vite (`vite v5.4.21`)
- **Styling**: Tailwind CSS
- **Charting**: Recharts (v2.15.4 - deprecated warning present)
- **Deployment**: Docker container serving static files (Nginx likely)

## 2. Backend
- **Framework**: Spring Boot (v3.2.4)
- **Java Version**: Java 21
- **Security**: Spring Security with JWT Authentication
- **Database Access**: Spring Data JPA
- **Build Tool**: Maven

## 3. Machine Learning Service
- **Framework**: FastAPI (Python)
- **Models**: XGBoost, Random Forest, Decision Tree, Logistic Regression
- **Explainability**: SHAP (SHapley Additive exPlanations)
- **Data Processing**: Pandas, Scikit-learn (StandardScaler)

## 4. Database
- **Engine**: MySQL (indicated by docker-compose and Spring Boot driver)
- **Schema Management**: Likely Hibernate auto-ddl (update/create)

## 5. Docker Architecture
- **Containers**:
  1. `frontend` (React/Vite)
  2. `backend` (Spring Boot Java 21)
  3. `ml-service` (FastAPI Python)
  4. `mysql` (Database)

## 6. Discrepancies vs Documentation
- README claims AI Assistant uses an LLM, but actual implementation in `test.py` implies it's a simulated endpoint on the backend.
- ML dataset is synthetic/Kaggle, not real MoSPI/PAIMANA data as implied by the problem space.
