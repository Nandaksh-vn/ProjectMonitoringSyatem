-- ============================================================
-- InfraWatch AI - Database Initialization Master Script
-- Combined Schema Definition and Synthetic Seed Data
-- ============================================================

CREATE DATABASE IF NOT EXISTS infrawatch_db;
USE infrawatch_db;

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
    FOREIGN KEY (ministry_id) REFERENCES ministries(id) ON DELETE RESTRICT,
    FOREIGN KEY (sector_id) REFERENCES sectors(id) ON DELETE RESTRICT,
    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE RESTRICT
);

-- 7. Monthly Monitoring Data
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
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
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
    model_type VARCHAR(50) NOT NULL,
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
    overall_risk_score DECIMAL(5,2) NOT NULL,
    risk_level VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (model_version_id) REFERENCES model_versions(id) ON DELETE SET NULL
);

-- 11. Risk Factors Table
CREATE TABLE IF NOT EXISTS risk_factors (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    prediction_id BIGINT NOT NULL,
    factor_name VARCHAR(150) NOT NULL,
    impact_value DECIMAL(6,4) NOT NULL,
    direction VARCHAR(20) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prediction_id) REFERENCES predictions(id) ON DELETE CASCADE
);

-- 12. Alerts Table
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
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- 13. Recommendations Table
CREATE TABLE IF NOT EXISTS recommendations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT NOT NULL,
    prediction_id BIGINT,
    risk_factor VARCHAR(150) NOT NULL,
    recommendation TEXT NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    source VARCHAR(50) NOT NULL DEFAULT 'SYSTEM_RULES',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (prediction_id) REFERENCES predictions(id) ON DELETE SET NULL
);

-- Seed Roles
INSERT IGNORE INTO roles (id, name, description) VALUES
(1, 'ROLE_ADMIN', 'System Administrator with full access'),
(2, 'ROLE_MONITOR', 'Project Officer & Monitoring Authority'),
(3, 'ROLE_ANALYST', 'Data Scientist & Policy Analyst'),
(4, 'ROLE_VIEWER', 'Public / Read-only Executive Viewer');

-- Seed Users
INSERT IGNORE INTO users (id, username, password, full_name, email, department, role_id, is_active) VALUES
(1, 'admin', '$2a$10$e8W/2s1Y7P7A/R6c5.vJ8eTfN.b9w3u8vXy4z7w6v5u4t3s2r1q0P', 'System Administrator', 'admin@infrawatch.gov.in', 'IPMD MoSPI', 1, TRUE),
(2, 'monitor_user', '$2a$10$e8W/2s1Y7P7A/R6c5.vJ8eTfN.b9w3u8vXy4z7w6v5u4t3s2r1q0P', 'Rajesh Sharma', 'rajesh.sharma@morth.gov.in', 'Ministry of Road Transport', 2, TRUE),
(3, 'analyst_user', '$2a$10$e8W/2s1Y7P7A/R6c5.vJ8eTfN.b9w3u8vXy4z7w6v5u4t3s2r1q0P', 'Dr. Ananya Verma', 'ananya.verma@infrawatch.gov.in', 'Data Analytics Cell', 3, TRUE);

-- Seed Ministries
INSERT IGNORE INTO ministries (id, code, name, description) VALUES
(1, 'MORTH', 'Ministry of Road Transport and Highways', 'National Highways & Logistics Monitored Sector'),
(2, 'MOP', 'Ministry of Power', 'Thermal, Hydro, and Renewable Power Generation'),
(3, 'MOR', 'Ministry of Railways', 'Railway Lines, Electrification & Freight Corridors'),
(4, 'MOJS', 'Ministry of Jal Shakti', 'Water Supply, Sanitation and River Development'),
(5, 'MOC', 'Ministry of Coal', 'Coal Mining and Infrastructure Expansion');

-- Seed Sectors
INSERT IGNORE INTO sectors (id, code, name, description) VALUES
(1, 'TRANS', 'Transport & Logistics', 'Highways, Bridges, Expressways & Logistics Parks'),
(2, 'ENERGY', 'Energy & Power', 'Power Plants, Transmission Lines & Sub-stations'),
(3, 'WATER', 'Water & Sanitation', 'Bulk Water Pipelines & Sewage Treatment Facilities'),
(4, 'RAIL', 'Railways', 'Dedicated Freight Corridors & Track Doubling'),
(5, 'MINING', 'Coal & Mining', 'Opencast Mines & Coal Handling Plants');

-- Seed Agencies
INSERT IGNORE INTO agencies (id, code, name, ministry_id) VALUES
(1, 'NHAI', 'National Highways Authority of India', 1),
(2, 'NTPC', 'NTPC Limited', 2),
(3, 'NHPC', 'NHPC Limited', 2),
(4, 'DFCCIL', 'Dedicated Freight Corridor Corporation of India', 3),
(5, 'NJM', 'National Jal Jeevan Mission Authority', 4),
(6, 'CIL', 'Coal India Limited', 5);

-- Seed Projects Master
INSERT IGNORE INTO projects (
    id, project_code, project_name, ministry_id, sector_id, agency_id,
    state, district, approved_cost, revised_cost, current_expenditure,
    approval_date, original_start_date, original_completion_date, revised_completion_date,
    physical_progress, financial_progress, status
) VALUES
(1, 'PRJ-2024-001', 'Delhi-Mumbai Expressway Package 4 (Vadodara-Kim)', 1, 1, 1, 'Gujarat', 'Vadodara', 4500.00, 4500.00, 3375.00, '2022-01-15', '2022-04-01', '2026-06-30', '2026-06-30', 75.00, 75.00, 'ONGOING'),
(2, 'PRJ-2024-002', 'Singrauli Super Thermal Power Stage III (2x800 MW)', 2, 2, 2, 'Madhya Pradesh', 'Singrauli', 8200.00, 8900.00, 4272.00, '2021-08-10', '2021-11-01', '2025-12-31', '2026-09-30', 48.00, 48.00, 'DELAYED'),
(3, 'PRJ-2024-003', 'Subansiri Lower Hydroelectric Project (2000 MW)', 2, 2, 3, 'Arunachal Pradesh', 'Lower Subansiri', 6285.00, 19992.00, 17500.00, '2018-03-20', '2018-06-01', '2023-12-31', '2027-12-31', 62.00, 87.50, 'CRITICAL'),
(4, 'PRJ-2024-004', 'Dedicated Freight Corridor - Eastern Arm (Sanehwal-Khurja)', 3, 4, 4, 'Uttar Pradesh', 'Aligarh', 11500.00, 14200.00, 9656.00, '2019-05-12', '2019-09-01', '2024-03-31', '2027-03-31', 68.00, 68.00, 'CRITICAL'),
(5, 'PRJ-2024-005', 'Jal Jeevan Bulk Rural Water Pipeline Phase II', 4, 3, 5, 'Rajasthan', 'Jodhpur', 2400.00, 2550.00, 1912.50, '2022-09-01', '2023-01-01', '2026-03-31', '2026-06-30', 75.00, 75.00, 'ONGOING');

-- Seed Monthly Data
INSERT IGNORE INTO project_monthly_data (
    project_id, reporting_month, planned_physical_progress, actual_physical_progress,
    planned_financial_progress, actual_financial_progress, monthly_expenditure,
    cumulative_expenditure, milestones_planned, milestones_completed, milestones_delayed,
    revised_cost, revised_completion_date
) VALUES
(1, '2025-10-01', 60.00, 59.50, 60.00, 59.50, 180.00, 2677.50, 4, 4, 0, 4500.00, '2026-06-30'),
(1, '2025-11-01', 63.00, 62.80, 63.00, 62.80, 148.50, 2826.00, 2, 2, 0, 4500.00, '2026-06-30'),
(1, '2025-12-01', 66.00, 66.00, 66.00, 66.00, 144.00, 2970.00, 3, 3, 0, 4500.00, '2026-06-30'),
(1, '2026-01-01', 69.00, 69.10, 69.00, 69.10, 139.50, 3109.50, 2, 2, 0, 4500.00, '2026-06-30'),
(1, '2026-02-01', 72.00, 72.00, 72.00, 72.00, 130.50, 3240.00, 3, 3, 0, 4500.00, '2026-06-30'),
(1, '2026-03-01', 75.00, 75.00, 75.00, 75.00, 135.00, 3375.00, 4, 4, 0, 4500.00, '2026-06-30'),

(2, '2025-10-01', 52.00, 44.00, 52.00, 44.00, 90.00, 3916.00, 3, 2, 1, 8500.00, '2026-06-30'),
(2, '2025-11-01', 54.00, 45.00, 54.00, 45.00, 89.00, 4005.00, 2, 1, 1, 8600.00, '2026-06-30'),
(2, '2025-12-01', 56.00, 46.00, 56.00, 46.00, 89.00, 4094.00, 2, 1, 1, 8750.00, '2026-09-30'),
(2, '2026-01-01', 58.00, 46.50, 58.00, 46.50, 44.50, 4138.50, 4, 2, 2, 8900.00, '2026-09-30'),
(2, '2026-02-01', 60.00, 47.20, 60.00, 47.20, 62.30, 4200.80, 2, 1, 1, 8900.00, '2026-09-30'),
(2, '2026-03-01', 62.00, 48.00, 62.00, 48.00, 71.20, 4272.00, 3, 1, 2, 8900.00, '2026-09-30'),

(3, '2025-10-01', 85.00, 58.00, 85.00, 82.00, 250.00, 16393.00, 5, 2, 3, 18500.00, '2027-06-30'),
(3, '2025-11-01', 86.00, 59.00, 86.00, 83.00, 200.00, 16593.00, 3, 1, 2, 19000.00, '2027-06-30'),
(3, '2025-12-01', 87.00, 60.00, 87.00, 84.00, 200.00, 16793.00, 4, 1, 3, 19500.00, '2027-12-31'),
(3, '2026-01-01', 88.00, 60.50, 88.00, 85.50, 250.00, 17043.00, 2, 0, 2, 19992.00, '2027-12-31'),
(3, '2026-02-01', 89.00, 61.20, 89.00, 86.50, 200.00, 17243.00, 3, 1, 2, 19992.00, '2027-12-31'),
(3, '2026-03-01', 90.00, 62.00, 90.00, 87.50, 257.00, 17500.00, 4, 1, 3, 19992.00, '2027-12-31'),

(4, '2025-10-01', 80.00, 64.00, 80.00, 64.00, 120.00, 9088.00, 3, 1, 2, 13500.00, '2026-12-31'),
(4, '2025-11-01', 82.00, 65.00, 82.00, 65.00, 142.00, 9230.00, 2, 1, 1, 13800.00, '2026-12-31'),
(4, '2025-12-01', 84.00, 66.00, 84.00, 66.00, 142.00, 9372.00, 4, 2, 2, 14000.00, '2027-03-31'),
(4, '2026-01-01', 86.00, 66.80, 86.00, 66.80, 113.60, 9485.60, 2, 0, 2, 14200.00, '2027-03-31'),
(4, '2026-02-01', 88.00, 67.40, 88.00, 67.40, 85.20, 9570.80, 3, 1, 2, 14200.00, '2027-03-31'),
(4, '2026-03-01', 90.00, 68.00, 90.00, 68.00, 85.20, 9656.00, 3, 1, 2, 14200.00, '2027-03-31'),

(5, '2025-10-01', 65.00, 64.00, 65.00, 64.00, 60.00, 1632.00, 2, 2, 0, 2500.00, '2026-06-30'),
(5, '2025-11-01', 67.00, 66.50, 67.00, 66.50, 63.75, 1695.75, 2, 2, 0, 2500.00, '2026-06-30'),
(5, '2025-12-01', 69.00, 68.80, 69.00, 68.80, 58.65, 1754.40, 3, 3, 0, 2500.00, '2026-06-30'),
(5, '2026-01-01', 71.00, 70.90, 71.00, 70.90, 53.55, 1807.95, 2, 2, 0, 2550.00, '2026-06-30'),
(5, '2026-02-01', 73.00, 73.00, 73.00, 73.00, 53.55, 1861.50, 2, 2, 0, 2550.00, '2026-06-30'),
(5, '2026-03-01', 75.00, 75.00, 75.00, 75.00, 51.00, 1912.50, 3, 3, 0, 2550.00, '2026-06-30');

-- Seed Milestones
INSERT IGNORE INTO milestones (id, project_id, milestone_name, planned_date, actual_date, status, delay_days, description) VALUES
(1, 1, 'Pavement Layer Completion (Km 0-50)', '2025-12-15', '2025-12-14', 'COMPLETED', 0, 'Bituminous concrete wearing course completed'),
(2, 1, 'Interchange Bridge Superstructure', '2026-03-31', '2026-03-30', 'COMPLETED', 0, 'Pre-stressed concrete girders launched'),
(3, 2, 'Boiler Structure Erection Unit 1', '2025-06-30', '2025-10-15', 'COMPLETED', 107, 'Heavy crane availability delayed erection'),
(4, 2, 'TG Building Civil Works', '2025-12-31', NULL, 'DELAYED', 90, 'Contractor manpower shortage'),
(5, 3, 'Dam Structure Concreting Block 1-5', '2022-06-30', '2024-03-15', 'COMPLETED', 624, 'Geological landslide and flash floods'),
(6, 3, 'Powerhouse Turbine Installation Unit 1', '2023-11-30', NULL, 'DELAYED', 850, 'Equipment delivery delayed by river transport bottleneck'),
(7, 4, 'Track Laying Package A (120 Km)', '2024-09-30', '2025-08-20', 'COMPLETED', 324, 'ROW Land acquisition cleared late'),
(8, 4, 'Signaling & Telecommunication Integration', '2025-03-31', NULL, 'IN_PROGRESS', 365, 'Interlocking system installation under execution'),
(9, 5, 'Main Intake Well Commissioning', '2025-10-31', '2025-10-25', 'COMPLETED', 0, 'Testing and water flow trial successfully completed');

-- Seed Model Versions
INSERT IGNORE INTO model_versions (id, model_name, model_type, version, dataset_version, metrics_json, is_active) VALUES
(1, 'Baseline Logistic Regression', 'LOGISTIC_REGRESSION', 'v1.0.0', 'DS-CUF-2026-03', '{"accuracy": 0.74, "precision": 0.71, "recall": 0.68, "f1_score": 0.69, "roc_auc": 0.76}', FALSE),
(2, 'Random Forest Classifier', 'RANDOM_FOREST', 'v1.1.0', 'DS-CUF-ENG-2026-03', '{"accuracy": 0.86, "precision": 0.84, "recall": 0.82, "f1_score": 0.83, "roc_auc": 0.89}', FALSE),
(3, 'XGBoost Risk Classifier & Regressor', 'XGBOOST', 'v2.0.0', 'DS-CUF-ENG-2026-03', '{"accuracy": 0.91, "precision": 0.89, "recall": 0.88, "f1_score": 0.88, "roc_auc": 0.94, "mae": 3.42, "rmse": 5.18, "r2": 0.87}', TRUE);

-- Seed Predictions
INSERT IGNORE INTO predictions (id, project_id, model_version_id, cost_overrun_probability, predicted_cost_overrun_pct, time_overrun_probability, predicted_delay_months, overall_risk_score, risk_level) VALUES
(1, 1, 3, 0.0820, 0.00, 0.1250, 0.00, 14.50, 'LOW'),
(2, 2, 3, 0.5840, 8.54, 0.7620, 9.00, 58.20, 'MEDIUM'),
(3, 3, 3, 0.9650, 218.09, 0.9880, 48.00, 94.80, 'CRITICAL'),
(4, 4, 3, 0.8420, 23.48, 0.9150, 36.00, 81.40, 'HIGH'),
(5, 5, 3, 0.1850, 6.25, 0.2240, 3.00, 24.00, 'LOW');

-- Seed Risk Factors
INSERT IGNORE INTO risk_factors (id, prediction_id, factor_name, impact_value, direction, description) VALUES
(1, 3, 'Cost Growth % (218.09%)', 0.4250, 'INCREASE_RISK', 'Approved cost expanded from 6,285 Cr to 19,992 Cr'),
(2, 3, 'Progress Gap (28.00%)', 0.3120, 'INCREASE_RISK', 'Actual progress 62% vs Planned 90%'),
(3, 3, 'Expenditure/Progress Mismatch', 0.2450, 'INCREASE_RISK', '87.5% financial spend vs only 62% physical completion'),
(4, 4, 'Milestone Delay Rate (66.7%)', 0.3800, 'INCREASE_RISK', '2 out of 3 quarterly milestones delayed'),
(5, 4, 'Land Acquisition ROW Delay', 0.2850, 'INCREASE_RISK', 'Right-of-Way clearance delayed by 18 months'),
(6, 2, 'Equipment Delivery Bottleneck', 0.2200, 'INCREASE_RISK', 'Boiler component shipments behind schedule');

-- Seed Alerts
INSERT IGNORE INTO alerts (id, project_id, alert_type, severity, title, description, trigger_value, threshold_value, suggested_action, resolved_status) VALUES
(1, 3, 'COST_OVERRUN_WARNING', 'CRITICAL', 'Severe Cost Escalation Alert (>200%)', 'Project cost has escalated by 218% reaching 19,992 Cr. Financial spend velocity significantly exceeds physical completion.', 218.09, 20.00, 'Convene High-Level Empowered Committee (HLEC) for technical financial audit & cost rationalization.', FALSE),
(2, 3, 'PROGRESS_MISMATCH', 'HIGH', 'Physical vs Financial Progress Discrepancy', 'Cumulative financial progress stands at 87.5% while physical progress is lagging at 62.0% (Gap: 25.5%).', 25.50, 10.00, 'Verify contractor bills and physically audit site milestone measurements.', FALSE),
(3, 4, 'SCHEDULE_SLIPPAGE', 'HIGH', 'Critical Schedule Extension Triggered', 'Projected commissioning date extended by 36 months beyond original target.', 36.00, 12.00, 'Inter-ministerial escalation with State Govt for ROW clearance.', FALSE),
(4, 2, 'MILESTONE_DELAY', 'MEDIUM', 'Turbine Generator Building Delay', 'TG Building Civil Works milestone has slipped past target date by 90 days.', 90.00, 30.00, 'Issue contractual notice to main civil EPC contractor for resource deployment.', FALSE);

-- Seed Recommendations
INSERT IGNORE INTO recommendations (id, project_id, prediction_id, risk_factor, recommendation, priority, source) VALUES
(1, 3, 3, 'Cost Growth %', 'Initiate mandatory third-party cost escalation audit prior to approving further fund release.', 'URGENT', 'LLM_ASSISTANT'),
(2, 3, 3, 'Progress Gap', 'Deploy specialized geological mitigation team to expedite dam block 1-5 stabilization.', 'HIGH', 'SYSTEM_RULES'),
(3, 4, 4, 'Land Acquisition ROW Delay', 'Schedule monthly coordination meeting between Ministry of Railways and State Nodal Secretary.', 'HIGH', 'LLM_ASSISTANT'),
(4, 2, 2, 'Equipment Delivery Bottleneck', 'Fast-track heavy equipment transport permits across inter-state border checkposts.', 'MEDIUM', 'ML_MODEL');
