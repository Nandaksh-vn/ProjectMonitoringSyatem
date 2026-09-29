package com.infrawatch.service;

import com.infrawatch.entity.Prediction;
import com.infrawatch.entity.Project;
import com.infrawatch.entity.ProjectMonthlyData;
import com.infrawatch.repository.PredictionRepository;
import com.infrawatch.repository.ProjectMonthlyDataRepository;
import com.infrawatch.repository.ProjectRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Bulk CSV import for project master data, monthly progress and predictions.
 *
 * <p>The previous controller counted CSV lines and reported the count as
 * {@code recordsInserted} without persisting anything, so every upload returned
 * a success message while writing zero rows.
 */
@Service
public class DataImportService {

    private static final Logger logger = LoggerFactory.getLogger(DataImportService.class);
    private static final int MAX_ERRORS_REPORTED = 50;

    private static final List<String> PROJECT_REQUIRED =
            List.of("project_code", "project_name", "ministry_id", "sector_id", "agency_id",
                    "state", "district", "approved_cost", "revised_cost", "approval_date",
                    "original_start_date", "original_completion_date", "revised_completion_date");

    private static final List<String> MONTHLY_REQUIRED =
            List.of("project_id", "reporting_month", "planned_physical_progress",
                    "actual_physical_progress", "planned_financial_progress",
                    "actual_financial_progress", "monthly_expenditure", "cumulative_expenditure",
                    "revised_cost", "revised_completion_date");

    private static final List<String> PROJECT_OPTIONAL =
            List.of("current_expenditure", "physical_progress", "financial_progress", "status");

    private static final List<String> MONTHLY_OPTIONAL =
            List.of("milestones_planned", "milestones_completed", "milestones_delayed");

    private static final List<String> PREDICTION_OPTIONAL =
            List.of("model_version_id", "predicted_cost_overrun_pct", "predicted_delay_months");

    private final ProjectRepository projectRepository;
    private final ProjectMonthlyDataRepository monthlyDataRepository;
    private final PredictionRepository predictionRepository;

    public DataImportService(ProjectRepository projectRepository,
                             ProjectMonthlyDataRepository monthlyDataRepository,
                             PredictionRepository predictionRepository) {
        this.projectRepository = projectRepository;
        this.monthlyDataRepository = monthlyDataRepository;
        this.predictionRepository = predictionRepository;
    }

    public Map<String, Object> importProjects(MultipartFile file, boolean dryRun) {
        List<Map<String, String>> rows = readRows(file);
        Map<String, Object> result = newImportResult(file, rows.size(), dryRun);

        List<String> errors = new ArrayList<>();
        Map<String, String> headers = resolveHeaders(PROJECT_REQUIRED, PROJECT_OPTIONAL, rows);
        if (!hasColumns(headers, PROJECT_REQUIRED)) {
            errors.add("Missing required columns. Expected at least: " + String.join(", ", PROJECT_REQUIRED));
            return fail(result, errors);
        }

        List<Project> toSave = new ArrayList<>();
        int inserted = 0;
        int updated = 0;

        for (int i = 0; i < rows.size(); i++) {
            Map<String, String> row = canonicalRow(rows.get(i), headers);
            int lineNo = i + 2;
            try {
                Project project = new Project();
                project.setProjectCode(required(row, "project_code"));
                project.setProjectName(required(row, "project_name"));
                project.setMinistryId(parseLong(row, "ministry_id"));
                project.setSectorId(parseLong(row, "sector_id"));
                project.setAgencyId(parseLong(row, "agency_id"));
                project.setState(required(row, "state"));
                project.setDistrict(required(row, "district"));
                project.setApprovedCost(parseDecimal(row, "approved_cost"));
                project.setRevisedCost(parseDecimal(row, "revised_cost"));
                project.setCurrentExpenditure(parseDecimalOrDefault(row, "current_expenditure", BigDecimal.ZERO));
                project.setApprovalDate(parseDate(row, "approval_date"));
                project.setOriginalStartDate(parseDate(row, "original_start_date"));
                project.setOriginalCompletionDate(parseDate(row, "original_completion_date"));
                project.setRevisedCompletionDate(parseDate(row, "revised_completion_date"));
                project.setPhysicalProgress(parseDecimalOrDefault(row, "physical_progress", BigDecimal.ZERO));
                project.setFinancialProgress(parseDecimalOrDefault(row, "financial_progress", BigDecimal.ZERO));
                project.setStatus(value(row, "status", "ONGOING"));

                validateProject(project, lineNo, errors);

                Optional<Project> existing = projectRepository.findByProjectCode(project.getProjectCode());
                if (existing.isPresent()) {
                    applyOnto(project, existing.get());
                    project.setId(existing.get().getId());
                    updated++;
                } else {
                    inserted++;
                }
                toSave.add(project);
            } catch (RuntimeException e) {
                errors.add("Row " + lineNo + ": " + e.getMessage());
            }
        }

        if (!errors.isEmpty()) {
            return fail(result, errors);
        }
        if (!dryRun) {
            projectRepository.saveAll(toSave);
        }
        return complete(result, inserted, updated, 0);
    }

    public Map<String, Object> importMonthlyData(MultipartFile file, Long projectId, boolean dryRun) {
        List<Map<String, String>> rows = readRows(file);
        Map<String, Object> result = newImportResult(file, rows.size(), dryRun);

        List<String> errors = new ArrayList<>();
        Map<String, String> headers = resolveHeaders(MONTHLY_REQUIRED, MONTHLY_OPTIONAL, rows);
        if (!hasColumns(headers, MONTHLY_REQUIRED)) {
            errors.add("Missing required columns. Expected at least: " + String.join(", ", MONTHLY_REQUIRED));
            return fail(result, errors);
        }

        List<ProjectMonthlyData> toSave = new ArrayList<>();
        int inserted = 0;
        int updated = 0;

        for (int i = 0; i < rows.size(); i++) {
            Map<String, String> row = canonicalRow(rows.get(i), headers);
            int lineNo = i + 2;
            try {
                long rowProjectId = parseLong(row, "project_id");
                if (projectId != null && rowProjectId != projectId) {
                    errors.add("Row " + lineNo + ": project_id " + rowProjectId
                            + " does not match the selected project " + projectId + ".");
                    continue;
                }
                if (!projectRepository.existsById(rowProjectId)) {
                    errors.add("Row " + lineNo + ": project " + rowProjectId + " does not exist.");
                    continue;
                }

                LocalDate month = parseDate(row, "reporting_month");
                ProjectMonthlyData data = new ProjectMonthlyData();
                data.setProjectId(rowProjectId);
                data.setReportingMonth(month);
                data.setPlannedPhysicalProgress(parseDecimal(row, "planned_physical_progress"));
                data.setActualPhysicalProgress(parseDecimal(row, "actual_physical_progress"));
                data.setPlannedFinancialProgress(parseDecimal(row, "planned_financial_progress"));
                data.setActualFinancialProgress(parseDecimal(row, "actual_financial_progress"));
                data.setMonthlyExpenditure(parseDecimal(row, "monthly_expenditure"));
                data.setCumulativeExpenditure(parseDecimal(row, "cumulative_expenditure"));
                data.setMilestonesPlanned(parseIntOrDefault(row, "milestones_planned", 0));
                data.setMilestonesCompleted(parseIntOrDefault(row, "milestones_completed", 0));
                data.setMilestonesDelayed(parseIntOrDefault(row, "milestones_delayed", 0));
                data.setRevisedCost(parseDecimal(row, "revised_cost"));
                data.setRevisedCompletionDate(parseDate(row, "revised_completion_date"));

                Optional<ProjectMonthlyData> existing = monthlyDataRepository
                        .findByProjectIdAndReportingMonth(rowProjectId, month);
                if (existing.isPresent()) {
                    applyMonthlyOnto(data, existing.get());
                    data.setId(existing.get().getId());
                    updated++;
                } else {
                    inserted++;
                }
                toSave.add(data);
            } catch (RuntimeException e) {
                errors.add("Row " + lineNo + ": " + e.getMessage());
            }
        }

        if (!errors.isEmpty()) {
            return fail(result, errors);
        }
        if (!dryRun) {
            monthlyDataRepository.saveAll(toSave);
        }
        return complete(result, inserted, updated, 0);
    }

    public Map<String, Object> importPredictions(MultipartFile file, Long projectId, boolean dryRun) {
        List<Map<String, String>> rows = readRows(file);
        Map<String, Object> result = newImportResult(file, rows.size(), dryRun);

        List<String> errors = new ArrayList<>();
        List<String> required = List.of("project_id", "cost_overrun_probability",
                "time_overrun_probability", "overall_risk_score", "risk_level");
        Map<String, String> headers = resolveHeaders(required, PREDICTION_OPTIONAL, rows);
        if (!hasColumns(headers, required)) {
            errors.add("Missing required columns. Expected: " + String.join(", ", required));
            return fail(result, errors);
        }

        List<Prediction> toSave = new ArrayList<>();
        for (int i = 0; i < rows.size(); i++) {
            Map<String, String> row = canonicalRow(rows.get(i), headers);
            int lineNo = i + 2;
            try {
                long rowProjectId = parseLong(row, "project_id");
                if (projectId != null && rowProjectId != projectId) {
                    errors.add("Row " + lineNo + ": project_id " + rowProjectId
                            + " does not match the selected project " + projectId + ".");
                    continue;
                }
                if (!projectRepository.existsById(rowProjectId)) {
                    errors.add("Row " + lineNo + ": project " + rowProjectId + " does not exist.");
                    continue;
                }

                Prediction prediction = new Prediction();
                prediction.setProjectId(rowProjectId);
                prediction.setModelVersionId(parseLongOrNull(row, "model_version_id"));
                prediction.setCostOverrunProbability(parseDecimal(row, "cost_overrun_probability"));
                prediction.setPredictedCostOverrunPct(
                        parseDecimalOrDefault(row, "predicted_cost_overrun_pct", BigDecimal.ZERO));
                prediction.setTimeOverrunProbability(parseDecimal(row, "time_overrun_probability"));
                prediction.setPredictedDelayMonths(
                        parseDecimalOrDefault(row, "predicted_delay_months", BigDecimal.ZERO));
                prediction.setOverallRiskScore(parseDecimal(row, "overall_risk_score"));

                String riskLevel = required(row, "risk_level").toUpperCase();
                if (!Arrays.asList("LOW", "MEDIUM", "HIGH", "CRITICAL").contains(riskLevel)) {
                    errors.add("Row " + lineNo + ": risk_level must be LOW, MEDIUM, HIGH or CRITICAL.");
                    continue;
                }
                prediction.setRiskLevel(riskLevel);
                toSave.add(prediction);
            } catch (RuntimeException e) {
                errors.add("Row " + lineNo + ": " + e.getMessage());
            }
        }

        if (!errors.isEmpty()) {
            return fail(result, errors);
        }
        if (!dryRun) {
            predictionRepository.saveAll(toSave);
        }
        return complete(result, toSave.size(), 0, 0);
    }

    // ---------------------------------------------------------------- helpers

    private List<Map<String, String>> readRows(MultipartFile file) {
        try (InputStream in = file.getInputStream()) {
            return CsvReader.read(in);
        } catch (Exception e) {
            throw new IllegalArgumentException("Failed to read CSV: " + e.getMessage(), e);
        }
    }

    /**
     * Maps each known column name to the header actually present in the file, so a
     * spreadsheet export using "Project Id" or "REPORTING-MONTH" still imports.
     * Optional columns are included so their values survive canonicalisation.
     */
    private Map<String, String> resolveHeaders(List<String> required, List<String> optional,
                                               List<Map<String, String>> rows) {
        Map<String, String> byStrippedName = new LinkedHashMap<>();
        if (!rows.isEmpty()) {
            rows.get(0).keySet().forEach(header -> byStrippedName.putIfAbsent(strip(header), header));
        }
        Map<String, String> resolved = new LinkedHashMap<>();
        for (String name : concat(required, optional)) {
            String actualHeader = byStrippedName.get(strip(name));
            if (actualHeader != null) {
                resolved.put(name, actualHeader);
            }
        }
        return resolved;
    }

    private static List<String> concat(List<String> first, List<String> second) {
        List<String> all = new ArrayList<>(first);
        all.addAll(second);
        return all;
    }

    /** Re-keys a raw file row to the canonical column names used by the parsers. */
    private static Map<String, String> canonicalRow(Map<String, String> row, Map<String, String> headers) {
        Map<String, String> canonical = new LinkedHashMap<>();
        headers.forEach((name, actualHeader) -> canonical.put(name, row.getOrDefault(actualHeader, "")));
        return canonical;
    }

    private static String strip(String value) {
        return value == null ? "" : value.replaceAll("[^a-zA-Z0-9]", "").toLowerCase();
    }

    private boolean hasColumns(Map<String, String> headers, List<String> required) {
        return required.stream().allMatch(headers::containsKey);
    }

    private void validateProject(Project project, int lineNo, List<String> errors) {
        if (project.getApprovedCost() == null || project.getApprovedCost().compareTo(BigDecimal.ZERO) <= 0) {
            errors.add("Row " + lineNo + ": approved_cost must be greater than zero.");
        }
        if (project.getMinistryId() == null || project.getMinistryId() <= 0) {
            errors.add("Row " + lineNo + ": ministry_id must be a positive integer.");
        }
        if (project.getSectorId() == null || project.getSectorId() <= 0) {
            errors.add("Row " + lineNo + ": sector_id must be a positive integer.");
        }
        if (project.getAgencyId() == null || project.getAgencyId() <= 0) {
            errors.add("Row " + lineNo + ": agency_id must be a positive integer.");
        }
        if (project.getPhysicalProgress() != null
                && (project.getPhysicalProgress().compareTo(BigDecimal.ZERO) < 0
                || project.getPhysicalProgress().compareTo(new BigDecimal("100")) > 0)) {
            errors.add("Row " + lineNo + ": physical_progress must be between 0 and 100.");
        }
    }

    private void applyOnto(Project source, Project target) {
        target.setProjectName(source.getProjectName());
        target.setMinistryId(source.getMinistryId());
        target.setSectorId(source.getSectorId());
        target.setAgencyId(source.getAgencyId());
        target.setState(source.getState());
        target.setDistrict(source.getDistrict());
        target.setApprovedCost(source.getApprovedCost());
        target.setRevisedCost(source.getRevisedCost());
        target.setCurrentExpenditure(source.getCurrentExpenditure());
        target.setApprovalDate(source.getApprovalDate());
        target.setOriginalStartDate(source.getOriginalStartDate());
        target.setOriginalCompletionDate(source.getOriginalCompletionDate());
        target.setRevisedCompletionDate(source.getRevisedCompletionDate());
        target.setPhysicalProgress(source.getPhysicalProgress());
        target.setFinancialProgress(source.getFinancialProgress());
        target.setStatus(source.getStatus());
    }

    private void applyMonthlyOnto(ProjectMonthlyData source, ProjectMonthlyData target) {
        target.setPlannedPhysicalProgress(source.getPlannedPhysicalProgress());
        target.setActualPhysicalProgress(source.getActualPhysicalProgress());
        target.setPlannedFinancialProgress(source.getPlannedFinancialProgress());
        target.setActualFinancialProgress(source.getActualFinancialProgress());
        target.setMonthlyExpenditure(source.getMonthlyExpenditure());
        target.setCumulativeExpenditure(source.getCumulativeExpenditure());
        target.setMilestonesPlanned(source.getMilestonesPlanned());
        target.setMilestonesCompleted(source.getMilestonesCompleted());
        target.setMilestonesDelayed(source.getMilestonesDelayed());
        target.setRevisedCost(source.getRevisedCost());
        target.setRevisedCompletionDate(source.getRevisedCompletionDate());
    }

    private Map<String, Object> newImportResult(MultipartFile file, int rowCount, boolean dryRun) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("fileName", file.getOriginalFilename());
        result.put("recordsProcessed", rowCount);
        result.put("dryRun", dryRun);
        return result;
    }

    private Map<String, Object> complete(Map<String, Object> result, int inserted, int updated, int rejected) {
        result.put("status", "COMPLETED");
        result.put("message", (Boolean.TRUE.equals(result.get("dryRun")) ? "Validation passed. " : "Import complete. ")
                + inserted + " inserted, " + updated + " updated, " + rejected + " rejected.");
        result.put("recordsInserted", inserted);
        result.put("recordsUpdated", updated);
        result.put("recordsRejected", rejected);
        result.put("rowsImported", inserted + updated);
        return result;
    }

    private Map<String, Object> fail(Map<String, Object> result, List<String> errors) {
        result.put("status", "FAILED");
        result.put("message", "Import rejected. No rows were written.");
        result.put("recordsInserted", 0);
        result.put("recordsUpdated", 0);
        result.put("recordsRejected", result.get("recordsProcessed"));
        result.put("validationErrors", errors.size() > MAX_ERRORS_REPORTED
                ? errors.subList(0, MAX_ERRORS_REPORTED) : errors);
        result.put("errorCount", errors.size());
        logger.warn("CSV import rejected for {}: {} error(s)", result.get("fileName"), errors.size());
        return result;
    }

    private static String value(Map<String, String> row, String key, String fallback) {
        String raw = row.get(key);
        return raw == null || raw.trim().isEmpty() ? fallback : raw.trim();
    }

    private static String required(Map<String, String> row, String key) {
        String raw = row.get(key);
        if (raw == null || raw.trim().isEmpty()) {
            throw new IllegalArgumentException("'" + key + "' is required and must not be empty.");
        }
        return raw.trim();
    }

    private static long parseLong(Map<String, String> row, String key) {
        String raw = required(row, key);
        try {
            return Long.parseLong(raw);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("'" + key + "' must be an integer, got '" + raw + "'.");
        }
    }

    private static Long parseLongOrNull(Map<String, String> row, String key) {
        String raw = row.get(key);
        if (raw == null || raw.trim().isEmpty()) {
            return null;
        }
        try {
            return Long.parseLong(raw.trim());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("'" + key + "' must be an integer, got '" + raw + "'.");
        }
    }

    private static int parseIntOrDefault(Map<String, String> row, String key, int fallback) {
        String raw = row.get(key);
        if (raw == null || raw.trim().isEmpty()) {
            return fallback;
        }
        try {
            return Integer.parseInt(raw.trim());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("'" + key + "' must be an integer, got '" + raw + "'.");
        }
    }

    private static BigDecimal parseDecimal(Map<String, String> row, String key) {
        String raw = required(row, key);
        try {
            return new BigDecimal(raw.trim());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("'" + key + "' must be numeric, got '" + raw + "'.");
        }
    }

    private static BigDecimal parseDecimalOrDefault(Map<String, String> row, String key, BigDecimal fallback) {
        String raw = row.get(key);
        if (raw == null || raw.trim().isEmpty()) {
            return fallback;
        }
        try {
            return new BigDecimal(raw.trim()).setScale(4, RoundingMode.HALF_UP);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("'" + key + "' must be numeric, got '" + raw + "'.");
        }
    }

    private static LocalDate parseDate(Map<String, String> row, String key) {
        String raw = required(row, key);
        String normalised = raw.trim().replace('/', '-');
        for (DateTimeFormatter format : new DateTimeFormatter[]{
                DateTimeFormatter.ISO_LOCAL_DATE,
                DateTimeFormatter.ofPattern("d-M-uuuu"),
                DateTimeFormatter.ofPattern("dd-MM-uuuu"),
                DateTimeFormatter.ofPattern("uuuu-M-d"),
                DateTimeFormatter.ofPattern("d-M-uu")}) {
            try {
                return LocalDate.parse(normalised, format);
            } catch (RuntimeException ignored) {
                // try the next accepted layout
            }
        }
        throw new IllegalArgumentException("'" + key + "' must be a date such as 2026-03-31, got '" + raw + "'.");
    }

    /** Column names this import understands, for the frontend template download. */
    public Map<String, List<String>> columnTemplates() {
        Map<String, List<String>> templates = new LinkedHashMap<>();
        templates.put("projects", concat(PROJECT_REQUIRED, PROJECT_OPTIONAL));
        templates.put("monthly-data", concat(MONTHLY_REQUIRED, MONTHLY_OPTIONAL));
        templates.put("predictions", concat(
                List.of("project_id", "cost_overrun_probability", "time_overrun_probability",
                        "overall_risk_score", "risk_level"),
                PREDICTION_OPTIONAL));
        return templates;
    }
}
