-- Spring Boot Auto-Initialization Schema
-- Supports both MySQL and H2 ANSI SQL standards

CREATE TABLE IF NOT EXISTS roles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE IF NOT EXISTS ministries (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sectors (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS agencies (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    ministry_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ministry_id) REFERENCES ministries(id)
);

CREATE TABLE IF NOT EXISTS projects (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_code VARCHAR(50) NOT NULL UNIQUE,
    project_name VARCHAR(255) NOT NULL,
    ministry_id BIGINT NOT NULL,
    sector_id BIGINT NOT NULL,
    agency_id BIGINT NOT NULL,
    state VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    approved_cost DECIMAL(15,2) NOT NULL,
    revised_cost DECIMAL(15,2) NOT NULL,
    current_expenditure DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    approval_date DATE NOT NULL,
    original_start_date DATE NOT NULL,
    original_completion_date DATE NOT NULL,
    revised_completion_date DATE NOT NULL,
    physical_progress DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    financial_progress DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'ONGOING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ministry_id) REFERENCES ministries(id),
    FOREIGN KEY (sector_id) REFERENCES sectors(id),
    FOREIGN KEY (agency_id) REFERENCES agencies(id)
);

CREATE TABLE IF NOT EXISTS project_monthly_data (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT NOT NULL,
    reporting_month DATE NOT NULL,
    planned_physical_progress DECIMAL(5,2) NOT NULL,
    actual_physical_progress DECIMAL(5,2) NOT NULL,
    planned_financial_progress DECIMAL(5,2) NOT NULL,
    actual_financial_progress DECIMAL(5,2) NOT NULL,
    monthly_expenditure DECIMAL(15,2) NOT NULL,
    cumulative_expenditure DECIMAL(15,2) NOT NULL,
    milestones_planned INT NOT NULL DEFAULT 0,
    milestones_completed INT NOT NULL DEFAULT 0,
    milestones_delayed INT NOT NULL DEFAULT 0,
    revised_cost DECIMAL(15,2) NOT NULL,
    revised_completion_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    CONSTRAINT uk_project_month UNIQUE (project_id, reporting_month)
);

CREATE TABLE IF NOT EXISTS milestones (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT NOT NULL,
    milestone_name VARCHAR(255) NOT NULL,
    planned_date DATE NOT NULL,
    actual_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    delay_days INT DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE TABLE IF NOT EXISTS model_versions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    model_name VARCHAR(100) NOT NULL,
    model_type VARCHAR(50) NOT NULL,
    version VARCHAR(20) NOT NULL,
    training_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dataset_version VARCHAR(50) NOT NULL,
    metrics_json VARCHAR(1000),
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS predictions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT NOT NULL,
    model_version_id BIGINT,
    prediction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cost_overrun_probability DECIMAL(5,4) NOT NULL,
    predicted_cost_overrun_pct DECIMAL(6,2) NOT NULL,
    time_overrun_probability DECIMAL(5,4) NOT NULL,
    predicted_delay_months DECIMAL(5,2) NOT NULL,
    overall_risk_score DECIMAL(5,2) NOT NULL,
    risk_level VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (model_version_id) REFERENCES model_versions(id)
);

CREATE TABLE IF NOT EXISTS risk_factors (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    prediction_id BIGINT NOT NULL,
    factor_name VARCHAR(150) NOT NULL,
    impact_value DECIMAL(6,4) NOT NULL,
    direction VARCHAR(20) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prediction_id) REFERENCES predictions(id)
);

CREATE TABLE IF NOT EXISTS alerts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT NOT NULL,
    alert_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    trigger_value DECIMAL(10,2),
    threshold_value DECIMAL(10,2),
    suggested_action TEXT,
    resolved_status BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE TABLE IF NOT EXISTS recommendations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT NOT NULL,
    recommendation_type VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority_level VARCHAR(20) DEFAULT 'MEDIUM',
    action_taken_status BOOLEAN DEFAULT FALSE,
    action_taken_details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id)
);
