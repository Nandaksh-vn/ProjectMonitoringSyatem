-- ============================================================
-- InfraWatch AI - Relational Database Schema
-- Compatible with MySQL 8.0+ and H2 Database Engine
-- ============================================================

-- 1. Roles Table
CREATE TABLE IF NOT EXISTS roles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    department VARCHAR(100),
    role_id BIGINT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
);

-- 3. Ministries Table
CREATE TABLE IF NOT EXISTS ministries (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Sectors Table
CREATE TABLE IF NOT EXISTS sectors (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Agencies Table
CREATE TABLE IF NOT EXISTS agencies (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    ministry_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ministry_id) REFERENCES ministries(id) ON DELETE RESTRICT
);

-- 6. Projects Table (Master Data)
CREATE TABLE IF NOT EXISTS projects (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_code VARCHAR(50) NOT NULL UNIQUE,
    project_name VARCHAR(255) NOT NULL,
    ministry_id BIGINT NOT NULL,
    sector_id BIGINT NOT NULL,
    agency_id BIGINT NOT NULL,
    state VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    approved_cost DECIMAL(15,2) NOT NULL COMMENT 'Approved cost in INR Crores',
    revised_cost DECIMAL(15,2) NOT NULL COMMENT 'Revised cost in INR Crores',
    current_expenditure DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Cumulative exp in INR Crores',
    approval_date DATE NOT NULL,
    original_start_date DATE NOT NULL,
    original_completion_date DATE NOT NULL,
    revised_completion_date DATE NOT NULL,
    physical_progress DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT 'Current Physical Progress %',
    financial_progress DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT 'Current Financial Progress %',
    status VARCHAR(50) NOT NULL DEFAULT 'ONGOING' COMMENT 'ONGOING, DELAYED, COMPLETED, CRITICAL',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ministry_id) REFERENCES ministries(id) ON DELETE RESTRICT,
    FOREIGN KEY (sector_id) REFERENCES sectors(id) ON DELETE RESTRICT,
    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE RESTRICT
);

-- 7. Monthly Monitoring Data (CUF Periodic Snapshots)
CREATE TABLE IF NOT EXISTS project_monthly_data (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT NOT NULL,
    reporting_month DATE NOT NULL COMMENT 'First day of month e.g. 2026-01-01',
    planned_physical_progress DECIMAL(5,2) NOT NULL,
    actual_physical_progress DECIMAL(5,2) NOT NULL,
    planned_financial_progress DECIMAL(5,2) NOT NULL,
    actual_financial_progress DECIMAL(5,2) NOT NULL,
    monthly_expenditure DECIMAL(15,2) NOT NULL COMMENT 'Expenditure in month (INR Cr)',
    cumulative_expenditure DECIMAL(15,2) NOT NULL COMMENT 'Total cumulative exp (INR Cr)',
    milestones_planned INT NOT NULL DEFAULT 0,
    milestones_completed INT NOT NULL DEFAULT 0,
    milestones_delayed INT NOT NULL DEFAULT 0,
    revised_cost DECIMAL(15,2) NOT NULL,
    revised_completion_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT uk_project_month UNIQUE (project_id, reporting_month)
);

-- 8. Milestones Table
CREATE TABLE IF NOT EXISTS milestones (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT NOT NULL,
    milestone_name VARCHAR(255) NOT NULL,
    planned_date DATE NOT NULL,
    actual_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' COMMENT 'COMPLETED, PENDING, DELAYED, IN_PROGRESS',
    delay_days INT DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- 9. Model Versions Table
CREATE TABLE IF NOT EXISTS model_versions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    model_name VARCHAR(100) NOT NULL,
    model_type VARCHAR(50) NOT NULL COMMENT 'LOGISTIC_REGRESSION, DECISION_TREE, RANDOM_FOREST, XGBOOST',
    version VARCHAR(20) NOT NULL,
    training_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dataset_version VARCHAR(50) NOT NULL,
    metrics_json JSON,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Predictions Table
CREATE TABLE IF NOT EXISTS predictions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT NOT NULL,
    model_version_id BIGINT,
    prediction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cost_overrun_probability DECIMAL(5,4) NOT NULL,
    predicted_cost_overrun_pct DECIMAL(6,2) NOT NULL,
    time_overrun_probability DECIMAL(5,4) NOT NULL,
    predicted_delay_months DECIMAL(5,2) NOT NULL,
    overall_risk_score DECIMAL(5,2) NOT NULL COMMENT 'Scale 0 to 100',
    risk_level VARCHAR(20) NOT NULL COMMENT 'LOW, MEDIUM, HIGH, CRITICAL',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (model_version_id) REFERENCES model_versions(id) ON DELETE SET NULL
);

-- 11. Risk Factors Table (SHAP / Feature Drivers)
CREATE TABLE IF NOT EXISTS risk_factors (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    prediction_id BIGINT NOT NULL,
    factor_name VARCHAR(150) NOT NULL,
    impact_value DECIMAL(6,4) NOT NULL,
    direction VARCHAR(20) NOT NULL COMMENT 'INCREASE_RISK, DECREASE_RISK',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prediction_id) REFERENCES predictions(id) ON DELETE CASCADE
);

-- 12. Alerts Table (Early Warning Signals)
CREATE TABLE IF NOT EXISTS alerts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT NOT NULL,
    alert_type VARCHAR(100) NOT NULL COMMENT 'COST_OVERRUN_WARNING, SCHEDULE_SLIPPAGE, PROGRESS_MISMATCH, MILESTONE_DELAY',
    severity VARCHAR(20) NOT NULL COMMENT 'INFO, LOW, MEDIUM, HIGH, CRITICAL',
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    trigger_value DECIMAL(10,2),
    threshold_value DECIMAL(10,2),
    suggested_action TEXT,
    resolved_status BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- 13. Recommendations Table
CREATE TABLE IF NOT EXISTS recommendations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT NOT NULL,
    prediction_id BIGINT,
    risk_factor VARCHAR(150) NOT NULL,
    recommendation TEXT NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM' COMMENT 'LOW, MEDIUM, HIGH, URGENT',
    source VARCHAR(50) NOT NULL DEFAULT 'SYSTEM_RULES' COMMENT 'SYSTEM_RULES, ML_MODEL, LLM_ASSISTANT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (prediction_id) REFERENCES predictions(id) ON DELETE SET NULL
);

-- ============================================================
-- Performance Indexes
-- ============================================================
CREATE INDEX idx_projects_ministry ON projects(ministry_id);
CREATE INDEX idx_projects_sector ON projects(sector_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_pmd_project ON project_monthly_data(project_id);
CREATE INDEX idx_pmd_month ON project_monthly_data(reporting_month);
CREATE INDEX idx_milestones_project ON milestones(project_id);
CREATE INDEX idx_predictions_project ON predictions(project_id);
CREATE INDEX idx_alerts_project_resolved ON alerts(project_id, resolved_status);
CREATE INDEX idx_recommendations_project ON recommendations(project_id);
