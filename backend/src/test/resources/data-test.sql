-- H2-safe fixture for the test profile.
-- Loaded after Hibernate creates the schema (defer-datasource-initialization).
-- Kept deliberately smaller than the MySQL demo seed: these rows exist to prove
-- the entity mapping and the controllers, not to look like production data.

INSERT INTO roles (id, name, description) VALUES
    (1, 'ROLE_ADMIN', 'System Administrator with full access'),
    (2, 'ROLE_MONITOR', 'Project Officer & Monitoring Authority'),
    (3, 'ROLE_ANALYST', 'Data Scientist & Policy Analyst'),
    (4, 'ROLE_VIEWER', 'Public / Read-only Executive Viewer'),
    (5, 'ROLE_PROJECT_MANAGER', 'Project Manager with project create/update rights');

-- Same BCrypt hash as the MySQL seed; plaintext is "password".
INSERT INTO users (id, username, password, full_name, email, department, role_id, is_active) VALUES
    (1, 'admin', '$2b$12$5ixEuClmw5dSIZwI5eslre05bZ1KRVGBw2zsdswanfpoJRpkxYwyC', 'System Administrator', 'admin@infrawatch.gov.in', 'IPMD MoSPI', 1, TRUE),
    (2, 'monitor_user', '$2b$12$5ixEuClmw5dSIZwI5eslre05bZ1KRVGBw2zsdswanfpoJRpkxYwyC', 'Rajesh Sharma', 'rajesh.sharma@morth.gov.in', 'Ministry of Road Transport', 2, TRUE),
    (3, 'viewer_user', '$2b$12$5ixEuClmw5dSIZwI5eslre05bZ1KRVGBw2zsdswanfpoJRpkxYwyC', 'Priya Nair', 'priya.nair@infrawatch.gov.in', 'Policy Review Unit', 4, TRUE),
    (4, 'deactivated_user', '$2b$12$5ixEuClmw5dSIZwI5eslre05bZ1KRVGBw2zsdswanfpoJRpkxYwyC', 'Former Officer', 'former@infrawatch.gov.in', 'IT Cell', 4, FALSE);

INSERT INTO ministries (id, code, name) VALUES
    (1, 'MORTH', 'Ministry of Road Transport & Highways'),
    (2, 'MOWR', 'Ministry of Water Resources');

INSERT INTO sectors (id, code, name) VALUES
    (1, 'ROADS', 'Road & Highway'),
    (2, 'IRRIGATION', 'Irrigation');

INSERT INTO agencies (id, code, name, ministry_id) VALUES
    (1, 'NHAI', 'National Highways Authority of India', 1),
    (2, 'CWC', 'Central Water Commission', 2);

INSERT INTO projects (id, project_code, project_name, ministry_id, sector_id, agency_id, state, district,
                      approved_cost, revised_cost, current_expenditure, approval_date, original_start_date,
                      original_completion_date, revised_completion_date, physical_progress,
                      financial_progress, status) VALUES
    (1, 'NH-044', 'Delhi-Amritsar-Kathmandu Expressway', 1, 1, 1, 'Punjab', 'Jalandhar',
     7500.00, 8250.00, 5400.00, DATE '2023-06-15', DATE '2023-07-01', DATE '2027-06-30', DATE '2027-12-31',
     65.00, 72.60, 'ONGOING'),
    (2, 'IR-102', 'Sarpuchowk Lift Irrigation', 2, 2, 2, 'Jammu & Kashmir', 'Reasi',
     1200.00, 1650.00, 1180.00, DATE '2022-01-10', DATE '2022-04-01', DATE '2026-03-31', DATE '2026-09-30',
     88.00, 71.52, 'ONGOING'),
    (3, 'NH-077', 'Purvanchal Expressway', 1, 1, 1, 'Uttar Pradesh', 'Lucknow',
     11000.00, 11000.00, 3000.00, DATE '2021-08-20', DATE '2021-10-01', DATE '2028-03-31', DATE '2028-03-31',
     27.00, 27.27, 'ONGOING');

INSERT INTO project_monthly_data (id, project_id, reporting_month, planned_physical_progress,
                                  actual_physical_progress, planned_financial_progress,
                                  actual_financial_progress, monthly_expenditure, cumulative_expenditure,
                                  milestones_planned, milestones_completed, milestones_delayed,
                                  revised_cost, revised_completion_date) VALUES
    (1, 1, DATE '2026-01-31', 55.00, 58.00, 62.00, 65.00, 120.00, 4800.00, 4, 4, 0, 8250.00, DATE '2027-12-31'),
    (2, 1, DATE '2026-02-28', 58.00, 61.00, 66.00, 68.00, 130.00, 4930.00, 4, 3, 1, 8250.00, DATE '2027-12-31'),
    (3, 1, DATE '2026-03-31', 60.00, 65.00, 70.00, 72.60, 470.00, 5400.00, 4, 4, 0, 8250.00, DATE '2027-12-31'),
    (4, 2, DATE '2026-01-31', 70.00, 74.00, 60.00, 64.00, 40.00, 800.00, 3, 3, 0, 1650.00, DATE '2026-09-30'),
    (5, 2, DATE '2026-02-28', 78.00, 82.00, 66.00, 68.00, 45.00, 845.00, 3, 2, 1, 1650.00, DATE '2026-09-30'),
    (6, 2, DATE '2026-03-31', 86.00, 88.00, 70.00, 71.52, 335.00, 1180.00, 3, 3, 0, 1650.00, DATE '2026-09-30'),
    (7, 3, DATE '2026-03-31', 25.00, 27.00, 26.00, 27.27, 500.00, 3000.00, 2, 1, 1, 11000.00, DATE '2028-03-31');

INSERT INTO milestones (id, project_id, milestone_name, planned_date, actual_date, status, delay_days, description) VALUES
    (1, 1, 'Land Acquisition - Jalandhar Bypass', DATE '2024-06-30', DATE '2024-05-20', 'COMPLETED', 0, 'Acquired six months ahead of plan.'),
    (2, 1, 'Purvanchal Link Expressway Opening', DATE '2026-01-31', NULL, 'DELAYED', 62, 'Opening slipped past the sanctioned date.'),
    (3, 2, 'Canal Head Regulator', DATE '2025-06-30', DATE '2025-05-11', 'COMPLETED', 0, 'Commissioned ahead of schedule.'),
    (4, 3, 'Bridge Pier Casting - 40%', DATE '2026-06-30', NULL, 'IN_PROGRESS', 0, 'On track as of the last review.');

INSERT INTO model_versions (id, model_name, model_type, version, dataset_version, metrics_json, is_active) VALUES
    (1, 'Baseline Logistic Regression', 'LOGISTIC_REGRESSION', 'v1.0.0', 'DS-CUF-2026-03',
     '{"accuracy": 0.74, "precision": 0.71}', FALSE),
    (2, 'InfraWatch ML Bundle (cost + schedule + risk)', 'MULTI_TARGET', '3.0.0',
     'Kaggle-COST + SYNTHETIC-SCHEDULE',
     '{"cost_roc_auc": 1.0, "time_roc_auc": 0.9557, "risk_r2": 0.8414, "risk_mae": 4.92}', TRUE);

INSERT INTO predictions (id, project_id, model_version_id, prediction_date, cost_overrun_probability,
                         predicted_cost_overrun_pct, time_overrun_probability, predicted_delay_months,
                         overall_risk_score, risk_level) VALUES
    (1, 1, 2, TIMESTAMP '2026-03-31 23:00:00', 0.7100, 18.50, 0.6400, 6.00, 78.40, 'HIGH'),
    (2, 2, 2, TIMESTAMP '2026-03-31 23:00:00', 0.8800, 37.50, 0.9100, 6.00, 91.20, 'CRITICAL'),
    (3, 3, 2, TIMESTAMP '2026-03-31 23:00:00', 0.1200, 0.00, 0.0800, 0.00, 14.60, 'LOW');

INSERT INTO risk_factors (id, prediction_id, factor_name, impact_value, direction, description) VALUES
    (1, 1, 'cost_escalation_ratio', 0.4200, 'INCREASE_RISK', 'Revised cost is 10% above approved cost'),
    (2, 1, 'expenditure_to_budget_ratio', 0.2600, 'INCREASE_RISK', '65% of revised budget spent'),
    (3, 1, 'time_elapsed_ratio', 0.1800, 'INCREASE_RISK', '75% of the original window elapsed'),
    (4, 2, 'cost_escalation_ratio', 0.5100, 'INCREASE_RISK', 'Revised cost is 37.5% above approved cost'),
    (5, 2, 'physical_progress_gap', 0.1200, 'INCREASE_RISK', 'Physical progress slightly behind plan'),
    (6, 2, 'expenditure_to_budget_ratio', 0.2400, 'INCREASE_RISK', 'Spend is outrunning physical progress'),
    (7, 3, 'cost_escalation_ratio', 0.0500, 'NEUTRAL', 'No cost escalation yet');

INSERT INTO alerts (id, project_id, alert_type, severity, title, description, trigger_value,
                    threshold_value, suggested_action, resolved_status) VALUES
    (1, 1, 'Cost Escalation', 'HIGH', 'Revised cost exceeds approved cost',
     'Revised cost of 8250.00 Cr is 10.0% above the approved 7500.00 Cr.',
     10.00, 10.00, 'Freeze uncommitted cost headroom pending review.', FALSE),
    (2, 2, 'High Risk', 'CRITICAL', 'Overall risk score above critical threshold',
     'Overall risk score 91.2 is above the 70.0 threshold.',
     91.20, 70.00, 'Escalate to the monitoring authority this week.', FALSE),
    (3, 3, 'Progress Gap', 'LOW', 'Physical progress marginally behind plan',
     'Actual physical progress is 2% behind plan.',
     2.00, 10.00, 'Continue the existing fortnightly review cadence.', TRUE);

INSERT INTO recommendations (id, project_id, recommendation_type, title, description, priority_level,
                             action_taken_status, action_taken_details) VALUES
    (1, 1, 'COST', 'Freeze uncommitted cost headroom', 'Cap further commitments at 5% of remaining budget until the next review.', 'HIGH', FALSE, NULL),
    (2, 2, 'SCHEDULE', 'Rebaseline the completion date', 'The 6-month slip has not been reflected in the sanctioned schedule.', 'CRITICAL', FALSE, NULL),
    (3, 3, 'MONITORING', 'Continue fortnightly review', 'Project is tracking to plan; keep the existing cadence.', 'LOW', TRUE, 'Reviewed on 2026-04-02.');
