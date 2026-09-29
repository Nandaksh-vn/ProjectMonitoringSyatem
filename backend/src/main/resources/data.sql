-- Spring Boot Initial Seed Data (Development & Demo)
--
-- Every statement uses INSERT IGNORE so re-running this file is a no-op instead
-- of a duplicate-key failure. `spring.sql.init.mode=always` re-executes it on
-- every boot, and the previous plain INSERTs made that fail silently under
-- `continue-on-error: true`.
--
-- Seeded credentials (bcrypt hash shared by all demo users, password Admin@123):
--   admin / project_manager / monitor_user / analyst_user

INSERT IGNORE INTO roles (id, name, description) VALUES (1, 'ROLE_ADMIN', 'System Administrator with full access');
INSERT IGNORE INTO roles (id, name, description) VALUES (2, 'ROLE_MONITOR', 'Project Officer & Monitoring Authority');
INSERT IGNORE INTO roles (id, name, description) VALUES (3, 'ROLE_ANALYST', 'Data Scientist & Policy Analyst');
INSERT IGNORE INTO roles (id, name, description) VALUES (4, 'ROLE_VIEWER', 'Public / Read-only Executive Viewer');
INSERT IGNORE INTO roles (id, name, description) VALUES (5, 'ROLE_PROJECT_MANAGER', 'Project Manager with project create/update rights');

INSERT IGNORE INTO users (id, username, password, full_name, email, department, role_id, is_active) VALUES (1, 'admin', '$2b$12$5ixEuClmw5dSIZwI5eslre05bZ1KRVGBw2zsdswanfpoJRpkxYwyC', 'System Administrator', 'admin@infrawatch.gov.in', 'IPMD MoSPI', 1, TRUE);
INSERT IGNORE INTO users (id, username, password, full_name, email, department, role_id, is_active) VALUES (2, 'monitor_user', '$2b$12$5ixEuClmw5dSIZwI5eslre05bZ1KRVGBw2zsdswanfpoJRpkxYwyC', 'Rajesh Sharma', 'rajesh.sharma@morth.gov.in', 'Ministry of Road Transport', 2, TRUE);
INSERT IGNORE INTO users (id, username, password, full_name, email, department, role_id, is_active) VALUES (3, 'analyst_user', '$2b$12$5ixEuClmw5dSIZwI5eslre05bZ1KRVGBw2zsdswanfpoJRpkxYwyC', 'Dr. Ananya Verma', 'ananya.verma@infrawatch.gov.in', 'Data Analytics Cell', 3, TRUE);
INSERT IGNORE INTO users (id, username, password, full_name, email, department, role_id, is_active) VALUES (4, 'project_manager', '$2b$12$5ixEuClmw5dSIZwI5eslre05bZ1KRVGBw2zsdswanfpoJRpkxYwyC', 'Suresh Menon', 'suresh.menon@infrawatch.gov.in', 'Project Delivery Unit', 5, TRUE);
INSERT IGNORE INTO users (id, username, password, full_name, email, department, role_id, is_active) VALUES (5, 'viewer_user', '$2b$12$5ixEuClmw5dSIZwI5eslre05bZ1KRVGBw2zsdswanfpoJRpkxYwyC', 'Priya Nair', 'priya.nair@infrawatch.gov.in', 'Policy Review Unit', 4, TRUE);

INSERT IGNORE INTO ministries (id, code, name, description) VALUES (1, 'MORTH', 'Ministry of Road Transport and Highways', 'National Highways & Logistics Monitored Sector');
INSERT IGNORE INTO ministries (id, code, name, description) VALUES (2, 'MOP', 'Ministry of Power', 'Thermal, Hydro, and Renewable Power Generation');
INSERT IGNORE INTO ministries (id, code, name, description) VALUES (3, 'MOR', 'Ministry of Railways', 'Railway Lines, Electrification & Freight Corridors');
INSERT IGNORE INTO ministries (id, code, name, description) VALUES (4, 'MOJS', 'Ministry of Jal Shakti', 'Water Supply, Sanitation and River Development');
INSERT IGNORE INTO ministries (id, code, name, description) VALUES (5, 'MOC', 'Ministry of Coal', 'Coal Mining and Infrastructure Expansion');

INSERT IGNORE INTO sectors (id, code, name, description) VALUES (1, 'TRANS', 'Transport & Logistics', 'Highways, Bridges, Expressways & Logistics Parks');
INSERT IGNORE INTO sectors (id, code, name, description) VALUES (2, 'ENERGY', 'Energy & Power', 'Power Plants, Transmission Lines & Sub-stations');
INSERT IGNORE INTO sectors (id, code, name, description) VALUES (3, 'WATER', 'Water & Sanitation', 'Bulk Water Pipelines & Sewage Treatment Facilities');
INSERT IGNORE INTO sectors (id, code, name, description) VALUES (4, 'RAIL', 'Railways', 'Dedicated Freight Corridors & Track Doubling');
INSERT IGNORE INTO sectors (id, code, name, description) VALUES (5, 'MINING', 'Coal & Mining', 'Opencast Mines & Coal Handling Plants');

INSERT IGNORE INTO agencies (id, code, name, ministry_id) VALUES (1, 'NHAI', 'National Highways Authority of India', 1);
INSERT IGNORE INTO agencies (id, code, name, ministry_id) VALUES (2, 'NTPC', 'NTPC Limited', 2);
INSERT IGNORE INTO agencies (id, code, name, ministry_id) VALUES (3, 'NHPC', 'NHPC Limited', 2);
INSERT IGNORE INTO agencies (id, code, name, ministry_id) VALUES (4, 'DFCCIL', 'Dedicated Freight Corridor Corporation of India', 3);
INSERT IGNORE INTO agencies (id, code, name, ministry_id) VALUES (5, 'NJM', 'National Jal Jeevan Mission Authority', 4);
INSERT IGNORE INTO agencies (id, code, name, ministry_id) VALUES (6, 'CIL', 'Coal India Limited', 5);

INSERT IGNORE INTO projects (id, project_code, project_name, ministry_id, sector_id, agency_id, state, district, approved_cost, revised_cost, current_expenditure, approval_date, original_start_date, original_completion_date, revised_completion_date, physical_progress, financial_progress, status)
VALUES (1, 'PRJ-2024-001', 'Delhi-Mumbai Expressway Package 4 (Vadodara-Kim)', 1, 1, 1, 'Gujarat', 'Vadodara', 4500.00, 4500.00, 3375.00, '2022-01-15', '2022-04-01', '2026-06-30', '2026-06-30', 75.00, 75.00, 'ONGOING');

INSERT IGNORE INTO projects (id, project_code, project_name, ministry_id, sector_id, agency_id, state, district, approved_cost, revised_cost, current_expenditure, approval_date, original_start_date, original_completion_date, revised_completion_date, physical_progress, financial_progress, status)
VALUES (2, 'PRJ-2024-002', 'Singrauli Super Thermal Power Stage III (2x800 MW)', 2, 2, 2, 'Madhya Pradesh', 'Singrauli', 8200.00, 8900.00, 4272.00, '2021-08-10', '2021-11-01', '2025-12-31', '2026-09-30', 48.00, 48.00, 'DELAYED');

INSERT IGNORE INTO projects (id, project_code, project_name, ministry_id, sector_id, agency_id, state, district, approved_cost, revised_cost, current_expenditure, approval_date, original_start_date, original_completion_date, revised_completion_date, physical_progress, financial_progress, status)
VALUES (3, 'PRJ-2024-003', 'Subansiri Lower Hydroelectric Project (2000 MW)', 2, 2, 3, 'Arunachal Pradesh', 'Lower Subansiri', 6285.00, 19992.00, 17500.00, '2018-03-20', '2018-06-01', '2023-12-31', '2027-12-31', 62.00, 87.50, 'CRITICAL');

INSERT IGNORE INTO projects (id, project_code, project_name, ministry_id, sector_id, agency_id, state, district, approved_cost, revised_cost, current_expenditure, approval_date, original_start_date, original_completion_date, revised_completion_date, physical_progress, financial_progress, status)
VALUES (4, 'PRJ-2024-004', 'Dedicated Freight Corridor - Eastern Arm (Sanehwal-Khurja)', 3, 4, 4, 'Uttar Pradesh', 'Aligarh', 11500.00, 14200.00, 9656.00, '2019-05-12', '2019-09-01', '2024-03-31', '2027-03-31', 68.00, 68.00, 'CRITICAL');

INSERT IGNORE INTO projects (id, project_code, project_name, ministry_id, sector_id, agency_id, state, district, approved_cost, revised_cost, current_expenditure, approval_date, original_start_date, original_completion_date, revised_completion_date, physical_progress, financial_progress, status)
VALUES (5, 'PRJ-2024-005', 'Jal Jeevan Bulk Rural Water Pipeline Phase II', 4, 3, 5, 'Rajasthan', 'Jodhpur', 2400.00, 2550.00, 1912.50, '2022-09-01', '2023-01-01', '2026-03-31', '2026-06-30', 75.00, 75.00, 'ONGOING');

-- Monthly Monitoring Data (6 observations per project)
INSERT IGNORE INTO project_monthly_data (project_id, reporting_month, planned_physical_progress, actual_physical_progress, planned_financial_progress, actual_financial_progress, monthly_expenditure, cumulative_expenditure, milestones_planned, milestones_completed, milestones_delayed, revised_cost, revised_completion_date)
VALUES (1, '2025-10-01', 60.00, 59.50, 60.00, 59.50, 180.00, 2677.50, 4, 4, 0, 4500.00, '2026-06-30');
INSERT IGNORE INTO project_monthly_data (project_id, reporting_month, planned_physical_progress, actual_physical_progress, planned_financial_progress, actual_financial_progress, monthly_expenditure, cumulative_expenditure, milestones_planned, milestones_completed, milestones_delayed, revised_cost, revised_completion_date)
VALUES (1, '2025-11-01', 63.00, 62.80, 63.00, 62.80, 148.50, 2826.00, 2, 2, 0, 4500.00, '2026-06-30');
INSERT IGNORE INTO project_monthly_data (project_id, reporting_month, planned_physical_progress, actual_physical_progress, planned_financial_progress, actual_financial_progress, monthly_expenditure, cumulative_expenditure, milestones_planned, milestones_completed, milestones_delayed, revised_cost, revised_completion_date)
VALUES (1, '2025-12-01', 66.00, 66.00, 66.00, 66.00, 144.00, 2970.00, 3, 3, 0, 4500.00, '2026-06-30');
INSERT IGNORE INTO project_monthly_data (project_id, reporting_month, planned_physical_progress, actual_physical_progress, planned_financial_progress, actual_financial_progress, monthly_expenditure, cumulative_expenditure, milestones_planned, milestones_completed, milestones_delayed, revised_cost, revised_completion_date)
VALUES (1, '2026-01-01', 69.00, 69.10, 69.00, 69.10, 139.50, 3109.50, 2, 2, 0, 4500.00, '2026-06-30');
INSERT IGNORE INTO project_monthly_data (project_id, reporting_month, planned_physical_progress, actual_physical_progress, planned_financial_progress, actual_financial_progress, monthly_expenditure, cumulative_expenditure, milestones_planned, milestones_completed, milestones_delayed, revised_cost, revised_completion_date)
VALUES (1, '2026-02-01', 72.00, 72.00, 72.00, 72.00, 130.50, 3240.00, 3, 3, 0, 4500.00, '2026-06-30');
INSERT IGNORE INTO project_monthly_data (project_id, reporting_month, planned_physical_progress, actual_physical_progress, planned_financial_progress, actual_financial_progress, monthly_expenditure, cumulative_expenditure, milestones_planned, milestones_completed, milestones_delayed, revised_cost, revised_completion_date)
VALUES (1, '2026-03-01', 75.00, 75.00, 75.00, 75.00, 135.00, 3375.00, 4, 4, 0, 4500.00, '2026-06-30');

INSERT IGNORE INTO project_monthly_data (project_id, reporting_month, planned_physical_progress, actual_physical_progress, planned_financial_progress, actual_financial_progress, monthly_expenditure, cumulative_expenditure, milestones_planned, milestones_completed, milestones_delayed, revised_cost, revised_completion_date)
VALUES (2, '2025-10-01', 52.00, 44.00, 52.00, 44.00, 90.00, 3916.00, 3, 2, 1, 8500.00, '2026-06-30');
INSERT IGNORE INTO project_monthly_data (project_id, reporting_month, planned_physical_progress, actual_physical_progress, planned_financial_progress, actual_financial_progress, monthly_expenditure, cumulative_expenditure, milestones_planned, milestones_completed, milestones_delayed, revised_cost, revised_completion_date)
VALUES (2, '2025-11-01', 54.00, 45.00, 54.00, 45.00, 89.00, 4005.00, 2, 1, 1, 8600.00, '2026-06-30');
INSERT IGNORE INTO project_monthly_data (project_id, reporting_month, planned_physical_progress, actual_physical_progress, planned_financial_progress, actual_financial_progress, monthly_expenditure, cumulative_expenditure, milestones_planned, milestones_completed, milestones_delayed, revised_cost, revised_completion_date)
VALUES (2, '2025-12-01', 56.00, 46.00, 56.00, 46.00, 89.00, 4094.00, 2, 1, 1, 8750.00, '2026-09-30');
INSERT IGNORE INTO project_monthly_data (project_id, reporting_month, planned_physical_progress, actual_physical_progress, planned_financial_progress, actual_financial_progress, monthly_expenditure, cumulative_expenditure, milestones_planned, milestones_completed, milestones_delayed, revised_cost, revised_completion_date)
VALUES (2, '2026-01-01', 58.00, 46.50, 58.00, 46.50, 44.50, 4138.50, 4, 2, 2, 8900.00, '2026-09-30');
INSERT IGNORE INTO project_monthly_data (project_id, reporting_month, planned_physical_progress, actual_physical_progress, planned_financial_progress, actual_financial_progress, monthly_expenditure, cumulative_expenditure, milestones_planned, milestones_completed, milestones_delayed, revised_cost, revised_completion_date)
VALUES (2, '2026-02-01', 60.00, 47.20, 60.00, 47.20, 62.30, 4200.80, 2, 1, 1, 8900.00, '2026-09-30');
INSERT IGNORE INTO project_monthly_data (project_id, reporting_month, planned_physical_progress, actual_physical_progress, planned_financial_progress, actual_financial_progress, monthly_expenditure, cumulative_expenditure, milestones_planned, milestones_completed, milestones_delayed, revised_cost, revised_completion_date)
VALUES (2, '2026-03-01', 62.00, 48.00, 62.00, 48.00, 71.20, 4272.00, 3, 1, 2, 8900.00, '2026-09-30');

INSERT IGNORE INTO project_monthly_data (project_id, reporting_month, planned_physical_progress, actual_physical_progress, planned_financial_progress, actual_financial_progress, monthly_expenditure, cumulative_expenditure, milestones_planned, milestones_completed, milestones_delayed, revised_cost, revised_completion_date)
VALUES (3, '2025-10-01', 85.00, 58.00, 85.00, 82.00, 250.00, 16393.00, 5, 2, 3, 18500.00, '2027-06-30');
INSERT IGNORE INTO project_monthly_data (project_id, reporting_month, planned_physical_progress, actual_physical_progress, planned_financial_progress, actual_financial_progress, monthly_expenditure, cumulative_expenditure, milestones_planned, milestones_completed, milestones_delayed, revised_cost, revised_completion_date)
VALUES (3, '2025-11-01', 86.00, 59.00, 86.00, 83.00, 200.00, 16593.00, 3, 1, 2, 19000.00, '2027-06-30');
INSERT IGNORE INTO project_monthly_data (project_id, reporting_month, planned_physical_progress, actual_physical_progress, planned_financial_progress, actual_financial_progress, monthly_expenditure, cumulative_expenditure, milestones_planned, milestones_completed, milestones_delayed, revised_cost, revised_completion_date)
VALUES (3, '2025-12-01', 87.00, 60.00, 87.00, 84.00, 200.00, 16793.00, 4, 1, 3, 19500.00, '2027-12-31');
INSERT IGNORE INTO project_monthly_data (project_id, reporting_month, planned_physical_progress, actual_physical_progress, planned_financial_progress, actual_financial_progress, monthly_expenditure, cumulative_expenditure, milestones_planned, milestones_completed, milestones_delayed, revised_cost, revised_completion_date)
VALUES (3, '2026-01-01', 88.00, 60.50, 88.00, 85.50, 250.00, 17043.00, 2, 0, 2, 19992.00, '2027-12-31');
INSERT IGNORE INTO project_monthly_data (project_id, reporting_month, planned_physical_progress, actual_physical_progress, planned_financial_progress, actual_financial_progress, monthly_expenditure, cumulative_expenditure, milestones_planned, milestones_completed, milestones_delayed, revised_cost, revised_completion_date)
VALUES (3, '2026-02-01', 89.00, 61.20, 89.00, 86.50, 200.00, 17243.00, 3, 1, 2, 19992.00, '2027-12-31');
INSERT IGNORE INTO project_monthly_data (project_id, reporting_month, planned_physical_progress, actual_physical_progress, planned_financial_progress, actual_financial_progress, monthly_expenditure, cumulative_expenditure, milestones_planned, milestones_completed, milestones_delayed, revised_cost, revised_completion_date)
VALUES (3, '2026-03-01', 90.00, 62.00, 90.00, 87.50, 257.00, 17500.00, 4, 1, 3, 19992.00, '2027-12-31');

INSERT IGNORE INTO project_monthly_data (project_id, reporting_month, planned_physical_progress, actual_physical_progress, planned_financial_progress, actual_financial_progress, monthly_expenditure, cumulative_expenditure, milestones_planned, milestones_completed, milestones_delayed, revised_cost, revised_completion_date)
VALUES (4, '2025-10-01', 80.00, 64.00, 80.00, 64.00, 120.00, 9088.00, 3, 1, 2, 13500.00, '2026-12-31');
INSERT IGNORE INTO project_monthly_data (project_id, reporting_month, planned_physical_progress, actual_physical_progress, planned_financial_progress, actual_financial_progress, monthly_expenditure, cumulative_expenditure, milestones_planned, milestones_completed, milestones_delayed, revised_cost, revised_completion_date)
VALUES (4, '2025-11-01', 82.00, 65.00, 82.00, 65.00, 142.00, 9230.00, 2, 1, 1, 13800.00, '2026-12-31');
INSERT IGNORE INTO project_monthly_data (project_id, reporting_month, planned_physical_progress, actual_physical_progress, planned_financial_progress, actual_financial_progress, monthly_expenditure, cumulative_expenditure, milestones_planned, milestones_completed, milestones_delayed, revised_cost, revised_completion_date)
VALUES (4, '2025-12-01', 84.00, 66.00, 84.00, 66.00, 142.00, 9372.00, 4, 2, 2, 14000.00, '2027-03-31');
INSERT IGNORE INTO project_monthly_data (project_id, reporting_month, planned_physical_progress, actual_physical_progress, planned_financial_progress, actual_financial_progress, monthly_expenditure, cumulative_expenditure, milestones_planned, milestones_completed, milestones_delayed, revised_cost, revised_completion_date)
VALUES (4, '2026-01-01', 86.00, 66.80, 86.00, 66.80, 113.60, 9485.60, 2, 0, 2, 14200.00, '2027-03-31');
INSERT IGNORE INTO project_monthly_data (project_id, reporting_month, planned_physical_progress, actual_physical_progress, planned_financial_progress, actual_financial_progress, monthly_expenditure, cumulative_expenditure, milestones_planned, milestones_completed, milestones_delayed, revised_cost, revised_completion_date)
VALUES (4, '2026-02-01', 88.00, 67.40, 88.00, 67.40, 85.20, 9570.80, 3, 1, 2, 14200.00, '2027-03-31');
INSERT IGNORE INTO project_monthly_data (project_id, reporting_month, planned_physical_progress, actual_physical_progress, planned_financial_progress, actual_financial_progress, monthly_expenditure, cumulative_expenditure, milestones_planned, milestones_completed, milestones_delayed, revised_cost, revised_completion_date)
VALUES (4, '2026-03-01', 90.00, 68.00, 90.00, 68.00, 85.20, 9656.00, 3, 1, 2, 14200.00, '2027-03-31');

INSERT IGNORE INTO project_monthly_data (project_id, reporting_month, planned_physical_progress, actual_physical_progress, planned_financial_progress, actual_financial_progress, monthly_expenditure, cumulative_expenditure, milestones_planned, milestones_completed, milestones_delayed, revised_cost, revised_completion_date)
VALUES (5, '2025-10-01', 65.00, 64.00, 65.00, 64.00, 60.00, 1632.00, 2, 2, 0, 2500.00, '2026-06-30');
INSERT IGNORE INTO project_monthly_data (project_id, reporting_month, planned_physical_progress, actual_physical_progress, planned_financial_progress, actual_financial_progress, monthly_expenditure, cumulative_expenditure, milestones_planned, milestones_completed, milestones_delayed, revised_cost, revised_completion_date)
VALUES (5, '2025-11-01', 67.00, 66.50, 67.00, 66.50, 63.75, 1695.75, 2, 2, 0, 2500.00, '2026-06-30');
INSERT IGNORE INTO project_monthly_data (project_id, reporting_month, planned_physical_progress, actual_physical_progress, planned_financial_progress, actual_financial_progress, monthly_expenditure, cumulative_expenditure, milestones_planned, milestones_completed, milestones_delayed, revised_cost, revised_completion_date)
VALUES (5, '2025-12-01', 69.00, 68.80, 69.00, 68.80, 58.65, 1754.40, 3, 3, 0, 2500.00, '2026-06-30');
INSERT IGNORE INTO project_monthly_data (project_id, reporting_month, planned_physical_progress, actual_physical_progress, planned_financial_progress, actual_financial_progress, monthly_expenditure, cumulative_expenditure, milestones_planned, milestones_completed, milestones_delayed, revised_cost, revised_completion_date)
VALUES (5, '2026-01-01', 71.00, 70.90, 71.00, 70.90, 53.55, 1807.95, 2, 2, 0, 2550.00, '2026-06-30');
INSERT IGNORE INTO project_monthly_data (project_id, reporting_month, planned_physical_progress, actual_physical_progress, planned_financial_progress, actual_financial_progress, monthly_expenditure, cumulative_expenditure, milestones_planned, milestones_completed, milestones_delayed, revised_cost, revised_completion_date)
VALUES (5, '2026-02-01', 73.00, 73.00, 73.00, 73.00, 53.55, 1861.50, 2, 2, 0, 2550.00, '2026-06-30');
INSERT IGNORE INTO project_monthly_data (project_id, reporting_month, planned_physical_progress, actual_physical_progress, planned_financial_progress, actual_financial_progress, monthly_expenditure, cumulative_expenditure, milestones_planned, milestones_completed, milestones_delayed, revised_cost, revised_completion_date)
VALUES (5, '2026-03-01', 75.00, 75.00, 75.00, 75.00, 51.00, 1912.50, 3, 3, 0, 2550.00, '2026-06-30');

-- Milestones
INSERT IGNORE INTO milestones (id, project_id, milestone_name, planned_date, actual_date, status, delay_days, description) VALUES (1, 1, 'Pavement Layer Completion (Km 0-50)', '2025-12-15', '2025-12-14', 'COMPLETED', 0, 'Bituminous concrete wearing course completed');
INSERT IGNORE INTO milestones (id, project_id, milestone_name, planned_date, actual_date, status, delay_days, description) VALUES (2, 1, 'Interchange Bridge Superstructure', '2026-03-31', '2026-03-30', 'COMPLETED', 0, 'Pre-stressed concrete girders launched');
INSERT IGNORE INTO milestones (id, project_id, milestone_name, planned_date, actual_date, status, delay_days, description) VALUES (3, 2, 'Boiler Structure Erection Unit 1', '2025-06-30', '2025-10-15', 'COMPLETED', 107, 'Heavy crane availability delayed erection');
INSERT IGNORE INTO milestones (id, project_id, milestone_name, planned_date, actual_date, status, delay_days, description) VALUES (4, 2, 'TG Building Civil Works', '2025-12-31', NULL, 'DELAYED', 90, 'Contractor manpower shortage');
INSERT IGNORE INTO milestones (id, project_id, milestone_name, planned_date, actual_date, status, delay_days, description) VALUES (5, 3, 'Dam Structure Concreting Block 1-5', '2022-06-30', '2024-03-15', 'COMPLETED', 624, 'Geological landslide and flash floods');
INSERT IGNORE INTO milestones (id, project_id, milestone_name, planned_date, actual_date, status, delay_days, description) VALUES (6, 3, 'Powerhouse Turbine Installation Unit 1', '2023-11-30', NULL, 'DELAYED', 850, 'Equipment delivery delayed by river transport bottleneck');
INSERT IGNORE INTO milestones (id, project_id, milestone_name, planned_date, actual_date, status, delay_days, description) VALUES (7, 4, 'Track Laying Package A (120 Km)', '2024-09-30', '2025-08-20', 'COMPLETED', 324, 'ROW Land acquisition cleared late');
INSERT IGNORE INTO milestones (id, project_id, milestone_name, planned_date, actual_date, status, delay_days, description) VALUES (8, 4, 'Signaling & Telecommunication Integration', '2025-03-31', NULL, 'IN_PROGRESS', 365, 'Interlocking system installation under execution');
INSERT IGNORE INTO milestones (id, project_id, milestone_name, planned_date, actual_date, status, delay_days, description) VALUES (9, 5, 'Main Intake Well Commissioning', '2025-10-31', '2025-10-25', 'COMPLETED', 0, 'Testing and water flow trial successfully completed');

-- Model Versions
-- Model provenance. The v2.0.0 row previously claimed XGBoost was the active
-- model, which never matched the service: the ML bundle is version 3.0.0 and
-- serves three targets (cost, schedule, overall risk). The corrective UPDATEs
-- below fix the flag on databases that were seeded before this change, because
-- INSERT IGNORE will not touch an existing row.
INSERT IGNORE INTO model_versions (id, model_name, model_type, version, dataset_version, metrics_json, is_active) VALUES (1, 'Baseline Logistic Regression', 'LOGISTIC_REGRESSION', 'v1.0.0', 'DS-CUF-2026-03', '{"accuracy": 0.74, "precision": 0.71}', FALSE);
INSERT IGNORE INTO model_versions (id, model_name, model_type, version, dataset_version, metrics_json, is_active) VALUES (2, 'Random Forest Classifier', 'RANDOM_FOREST', 'v1.1.0', 'DS-CUF-ENG-2026-03', '{"accuracy": 0.86, "precision": 0.84}', FALSE);
INSERT IGNORE INTO model_versions (id, model_name, model_type, version, dataset_version, metrics_json, is_active) VALUES (3, 'XGBoost Baseline Bundle', 'XGBOOST', 'v2.0.0', 'DS-CUF-ENG-2026-03', '{"accuracy": 0.91, "precision": 0.89}', FALSE);
INSERT IGNORE INTO model_versions (id, model_name, model_type, version, dataset_version, metrics_json, is_active) VALUES (4, 'InfraWatch ML Bundle (cost + schedule + risk)', 'MULTI_TARGET', '3.0.0', 'Kaggle-COST + SYNTHETIC-SCHEDULE', '{"cost_roc_auc": 1.0, "time_roc_auc": 0.9557, "risk_r2": 0.8414, "risk_mae": 4.92}', TRUE);

UPDATE model_versions SET is_active = FALSE WHERE version <> '3.0.0';
UPDATE model_versions SET is_active = TRUE WHERE version = '3.0.0';

-- Predictions
INSERT IGNORE INTO predictions (id, project_id, model_version_id, cost_overrun_probability, predicted_cost_overrun_pct, time_overrun_probability, predicted_delay_months, overall_risk_score, risk_level) VALUES (1, 1, 3, 0.0820, 0.00, 0.1250, 0.00, 14.50, 'LOW');
INSERT IGNORE INTO predictions (id, project_id, model_version_id, cost_overrun_probability, predicted_cost_overrun_pct, time_overrun_probability, predicted_delay_months, overall_risk_score, risk_level) VALUES (2, 2, 3, 0.5840, 8.54, 0.7620, 9.00, 58.20, 'MEDIUM');
INSERT IGNORE INTO predictions (id, project_id, model_version_id, cost_overrun_probability, predicted_cost_overrun_pct, time_overrun_probability, predicted_delay_months, overall_risk_score, risk_level) VALUES (3, 3, 3, 0.9650, 218.09, 0.9880, 48.00, 94.80, 'CRITICAL');
INSERT IGNORE INTO predictions (id, project_id, model_version_id, cost_overrun_probability, predicted_cost_overrun_pct, time_overrun_probability, predicted_delay_months, overall_risk_score, risk_level) VALUES (4, 4, 3, 0.8420, 23.48, 0.9150, 36.00, 81.40, 'HIGH');
INSERT IGNORE INTO predictions (id, project_id, model_version_id, cost_overrun_probability, predicted_cost_overrun_pct, time_overrun_probability, predicted_delay_months, overall_risk_score, risk_level) VALUES (5, 5, 3, 0.1850, 6.25, 0.2240, 3.00, 24.00, 'LOW');

-- Risk Factors
INSERT IGNORE INTO risk_factors (id, prediction_id, factor_name, impact_value, direction, description) VALUES (1, 3, 'Cost Growth % (218.09%)', 0.4250, 'INCREASE_RISK', 'Approved cost expanded from 6,285 Cr to 19,992 Cr');
INSERT IGNORE INTO risk_factors (id, prediction_id, factor_name, impact_value, direction, description) VALUES (2, 3, 'Progress Gap (28.00%)', 0.3120, 'INCREASE_RISK', 'Actual progress 62% vs Planned 90%');
INSERT IGNORE INTO risk_factors (id, prediction_id, factor_name, impact_value, direction, description) VALUES (3, 3, 'Expenditure/Progress Mismatch', 0.2450, 'INCREASE_RISK', '87.5% financial spend vs only 62% physical completion');
INSERT IGNORE INTO risk_factors (id, prediction_id, factor_name, impact_value, direction, description) VALUES (4, 4, 'Milestone Delay Rate (66.7%)', 0.3800, 'INCREASE_RISK', '2 out of 3 quarterly milestones delayed');
INSERT IGNORE INTO risk_factors (id, prediction_id, factor_name, impact_value, direction, description) VALUES (5, 4, 'Land Acquisition ROW Delay', 0.2850, 'INCREASE_RISK', 'Right-of-Way clearance delayed by 18 months');
INSERT IGNORE INTO risk_factors (id, prediction_id, factor_name, impact_value, direction, description) VALUES (6, 2, 'Equipment Delivery Bottleneck', 0.2200, 'INCREASE_RISK', 'Boiler component shipments behind schedule');

-- Alerts
INSERT IGNORE INTO alerts (id, project_id, alert_type, severity, title, description, trigger_value, threshold_value, suggested_action, resolved_status) VALUES (1, 3, 'COST_OVERRUN_WARNING', 'CRITICAL', 'Severe Cost Escalation Alert (>200%)', 'Project cost has escalated by 218% reaching 19,992 Cr. Financial spend velocity significantly exceeds physical completion.', 218.09, 20.00, 'Convene High-Level Empowered Committee (HLEC) for technical financial audit & cost rationalization.', FALSE);
INSERT IGNORE INTO alerts (id, project_id, alert_type, severity, title, description, trigger_value, threshold_value, suggested_action, resolved_status) VALUES (2, 3, 'PROGRESS_MISMATCH', 'HIGH', 'Physical vs Financial Progress Discrepancy', 'Cumulative financial progress stands at 87.5% while physical progress is lagging at 62.0% (Gap: 25.5%).', 25.50, 10.00, 'Verify contractor bills and physically audit site milestone measurements.', FALSE);
INSERT IGNORE INTO alerts (id, project_id, alert_type, severity, title, description, trigger_value, threshold_value, suggested_action, resolved_status) VALUES (3, 4, 'SCHEDULE_SLIPPAGE', 'HIGH', 'Critical Schedule Extension Triggered', 'Projected commissioning date extended by 36 months beyond original target.', 36.00, 12.00, 'Inter-ministerial escalation with State Govt for ROW clearance.', FALSE);
INSERT IGNORE INTO alerts (id, project_id, alert_type, severity, title, description, trigger_value, threshold_value, suggested_action, resolved_status) VALUES (4, 2, 'MILESTONE_DELAY', 'MEDIUM', 'Turbine Generator Building Delay', 'TG Building Civil Works milestone has slipped past target date by 90 days.', 90.00, 30.00, 'Issue contractual notice to main civil EPC contractor for resource deployment.', FALSE);

-- Recommendations
INSERT IGNORE INTO recommendations (id, project_id, recommendation_type, title, description, priority_level, action_taken_status) VALUES (1, 3, 'COST', 'Cost Risk', 'Initiate mandatory third-party cost escalation audit prior to approving further fund release.', 'URGENT', FALSE);
INSERT IGNORE INTO recommendations (id, project_id, recommendation_type, title, description, priority_level, action_taken_status) VALUES (2, 3, 'SCHEDULE', 'Schedule Risk', 'Deploy specialized geological mitigation team to expedite dam block 1-5 stabilization.', 'HIGH', FALSE);
INSERT IGNORE INTO recommendations (id, project_id, recommendation_type, title, description, priority_level, action_taken_status) VALUES (3, 4, 'SCHEDULE', 'Schedule Risk', 'Schedule monthly coordination meeting between Ministry of Railways and State Nodal Secretary.', 'HIGH', FALSE);
INSERT IGNORE INTO recommendations (id, project_id, recommendation_type, title, description, priority_level, action_taken_status) VALUES (4, 2, 'PROCUREMENT', 'Procurement Risk', 'Fast-track heavy equipment transport permits across inter-state border checkposts.', 'MEDIUM', FALSE);
