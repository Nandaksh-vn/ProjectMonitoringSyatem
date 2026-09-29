package com.infrawatch.service;

import com.infrawatch.entity.Project;
import com.infrawatch.entity.ProjectMonthlyData;
import com.infrawatch.repository.ProjectMonthlyDataRepository;
import com.infrawatch.repository.ProjectRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@Transactional
@ActiveProfiles("test")
class DataImportServiceTest {

    private static final String MONTHLY_HEADER =
            "project_id,reporting_month,planned_physical_progress,actual_physical_progress,"
                    + "planned_financial_progress,actual_financial_progress,monthly_expenditure,"
                    + "cumulative_expenditure,milestones_planned,milestones_completed,milestones_delayed,"
                    + "revised_cost,revised_completion_date";

    @Autowired
    private DataImportService dataImportService;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ProjectMonthlyDataRepository monthlyDataRepository;

    private long projectId;

    @BeforeEach
    void setUp() {
        projectId = projectRepository.findByProjectCode("NH-044").orElseThrow().getId();
    }

    private static int intValue(Map<String, Object> result, String key) {
        return ((Number) result.get(key)).intValue();
    }

    private MockMultipartFile csv(String name, String body) {
        return new MockMultipartFile("file", name, "text/csv", body.getBytes());
    }

    @Test
    @DisplayName("Monthly rows are persisted with the values from the file")
    void importsMonthlyData() {
        long before = monthlyDataRepository.count();

        Map<String, Object> result = dataImportService.importMonthlyData(csv("monthly.csv",
                MONTHLY_HEADER + "\n"
                        + projectId + ",2026-04-30,68.00,70.00,74.00,76.50,150.00,5550.00,2,2,0,8250.00,2027-12-31\n"),
                projectId, false);

        assertEquals("COMPLETED", result.get("status"), result.toString());
        assertEquals(1, intValue(result, "recordsInserted"));
        assertEquals(0, intValue(result, "recordsUpdated"));
        assertEquals(before + 1, monthlyDataRepository.count());

        ProjectMonthlyData saved = monthlyDataRepository
                .findByProjectIdAndReportingMonth(projectId, LocalDate.of(2026, 4, 30)).orElseThrow();
        assertEquals(0, new BigDecimal("70.00").compareTo(saved.getActualPhysicalProgress()));
        assertEquals(0, new BigDecimal("5550.00").compareTo(saved.getCumulativeExpenditure()));
        assertEquals(2, saved.getMilestonesCompleted());
    }

    @Test
    @DisplayName("Re-uploading the same month updates in place instead of duplicating")
    void reUploadUpsertsMonthlyData() {
        Map<String, Object> result = dataImportService.importMonthlyData(csv("monthly.csv",
                MONTHLY_HEADER + "\n"
                        + projectId + ",2026-03-31,99.00,99.00,99.00,99.00,10.00,9999.00,1,1,0,8250.00,2027-12-31\n"),
                projectId, false);

        assertEquals("COMPLETED", result.get("status"), result.toString());
        assertEquals(0, intValue(result, "recordsInserted"));
        assertEquals(1, intValue(result, "recordsUpdated"));

        // The March fixture row must still be the only March row, now overwritten.
        List<ProjectMonthlyData> march = monthlyDataRepository
                .findByProjectIdOrderByReportingMonthDesc(projectId).stream()
                .filter(d -> d.getReportingMonth().equals(LocalDate.of(2026, 3, 31)))
                .toList();
        assertEquals(1, march.size(), "expected an upsert, found duplicate March rows");
        assertEquals(0, new BigDecimal("99.00").compareTo(march.get(0).getActualFinancialProgress()));
    }

    @Test
    @DisplayName("A dry run validates without writing any row")
    void dryRunWritesNothing() {
        long before = monthlyDataRepository.count();

        Map<String, Object> result = dataImportService.importMonthlyData(csv("monthly.csv",
                MONTHLY_HEADER + "\n"
                        + projectId + ",2026-05-31,70.00,71.00,76.00,78.00,160.00,5710.00,1,1,0,8250.00,2027-12-31\n"),
                projectId, true);

        assertEquals("COMPLETED", result.get("status"), result.toString());
        assertEquals(Boolean.TRUE, result.get("dryRun"));
        assertEquals(1, intValue(result, "recordsInserted"));
        assertEquals(before, monthlyDataRepository.count(), "dry run must not persist");
    }

    @Test
    @DisplayName("A bad row rejects the whole file and reports the line number")
    void badRowRejectsWholeFile() {
        long before = monthlyDataRepository.count();

        Map<String, Object> result = dataImportService.importMonthlyData(csv("monthly.csv",
                MONTHLY_HEADER + "\n"
                        + projectId + ",2026-06-30,70.00,71.00,76.00,78.00,160.00,5870.00,1,1,0,8250.00,2027-12-31\n"
                        + projectId + ",not-a-date,70.00,71.00,76.00,78.00,160.00,5870.00,1,1,0,8250.00,2027-12-31\n"),
                projectId, false);

        assertEquals("FAILED", result.get("status"));
        assertEquals(0, intValue(result, "recordsInserted"));
        assertEquals(before, monthlyDataRepository.count(), "nothing may be written when any row is invalid");

        @SuppressWarnings("unchecked")
        List<String> errors = (List<String>) result.get("validationErrors");
        assertNotNull(errors);
        assertTrue(errors.get(0).startsWith("Row 3:"), "expected a line-3 error, got: " + errors);
        assertTrue(errors.get(0).contains("reporting_month"), errors.get(0));
    }

    @Test
    @DisplayName("An unknown project is rejected instead of writing an orphan row")
    void unknownProjectRejected() {
        long before = monthlyDataRepository.count();

        Map<String, Object> result = dataImportService.importMonthlyData(csv("monthly.csv",
                MONTHLY_HEADER + "\n"
                        + "999999,2026-07-31,70.00,71.00,76.00,78.00,160.00,5870.00,1,1,0,8250.00,2027-12-31\n"),
                projectId, false);

        assertEquals("FAILED", result.get("status"));
        assertEquals(before, monthlyDataRepository.count());
    }

    @Test
    @DisplayName("A file whose project_id contradicts the request parameter is rejected")
    void projectIdMismatchRejected() {
        long otherProjectId = projectRepository.findByProjectCode("IR-102").orElseThrow().getId();

        Map<String, Object> result = dataImportService.importMonthlyData(csv("monthly.csv",
                MONTHLY_HEADER + "\n"
                        + otherProjectId + ",2026-08-31,70.00,71.00,76.00,78.00,160.00,5870.00,1,1,0,1650.00,2026-09-30\n"),
                projectId, false);

        assertEquals("FAILED", result.get("status"));
    }

    @Test
    @DisplayName("Missing columns are reported with the expected header names")
    void missingColumnsReported() {
        Map<String, Object> result = dataImportService.importMonthlyData(
                csv("monthly.csv", "project_id,reporting_month\n" + projectId + ",2026-09-30\n"),
                projectId, false);

        assertEquals("FAILED", result.get("status"));
        @SuppressWarnings("unchecked")
        List<String> errors = (List<String>) result.get("validationErrors");
        assertTrue(errors.get(0).contains("Missing required columns"), errors.get(0));
        assertTrue(errors.get(0).contains("actual_physical_progress"), errors.get(0));
    }

    @Test
    @DisplayName("Header matching tolerates camelCase, spaces and mixed case")
    void acceptsFuzzyHeaders() {
        Map<String, Object> result = dataImportService.importMonthlyData(csv("monthly.csv",
                "Project Id,Reporting Month,Planned Physical Progress,Actual Physical Progress,"
                        + "Planned Financial Progress,Actual Financial Progress,Monthly Expenditure,"
                        + "Cumulative Expenditure,Revised Cost,Revised Completion Date\n"
                        + projectId + ",2026-10-31,72.00,73.00,78.00,80.00,170.00,6040.00,8250.00,2027-12-31\n"),
                projectId, false);

        assertEquals("COMPLETED", result.get("status"), String.valueOf(result.get("validationErrors")));
        assertEquals(1, intValue(result, "recordsInserted"));
    }

    @Test
    @DisplayName("A quoted project name containing a comma survives the round trip")
    void handlesQuotedNameOnProjectImport() {
        long before = projectRepository.count();

        Map<String, Object> result = dataImportService.importProjects(csv("projects.csv",
                "project_code,project_name,ministry_id,sector_id,agency_id,state,district,"
                        + "approved_cost,revised_cost,current_expenditure,approval_date,original_start_date,"
                        + "original_completion_date,revised_completion_date,physical_progress,"
                        + "financial_progress,status\n"
                        + "NH-999,\"Quoted, Regional Bypass\",1,1,1,Kerala,Kottayam,"
                        + "500.00,550.00,100.00,2026-01-05,2026-02-01,2029-01-31,2029-01-31,5.00,18.18,ONGOING\n"),
                false);

        assertEquals("COMPLETED", result.get("status"), String.valueOf(result.get("validationErrors")));
        assertEquals(1, intValue(result, "recordsInserted"));

        Project saved = projectRepository.findByProjectCode("NH-999").orElseThrow();
        assertEquals("Quoted, Regional Bypass", saved.getProjectName());
        assertEquals(before + 1, projectRepository.count());
    }

    @Test
    @DisplayName("Importing an existing project code updates it rather than duplicating")
    void projectImportUpserts() {
        Map<String, Object> result = dataImportService.importProjects(csv("projects.csv",
                "project_code,project_name,ministry_id,sector_id,agency_id,state,district,"
                        + "approved_cost,revised_cost,current_expenditure,approval_date,original_start_date,"
                        + "original_completion_date,revised_completion_date,physical_progress,"
                        + "financial_progress,status\n"
                        + "NH-044,Delhi-Amritsar-Kathmandu Expressway (Phase I),1,1,1,Punjab,Jalandhar,"
                        + "7500.00,8400.00,5400.00,2023-06-15,2023-07-01,2027-06-30,2027-12-31,65.00,64.29,ONGOING\n"),
                false);

        assertEquals("COMPLETED", result.get("status"), String.valueOf(result.get("validationErrors")));
        assertEquals(0, intValue(result, "recordsInserted"));
        assertEquals(1, intValue(result, "recordsUpdated"));

        Project saved = projectRepository.findByProjectCode("NH-044").orElseThrow();
        assertEquals(0, new BigDecimal("8400.00").compareTo(saved.getRevisedCost()));
    }

    @Test
    @DisplayName("Progress above 100 percent is rejected")
    void rejectsOutOfRangeProgress() {
        Map<String, Object> result = dataImportService.importProjects(csv("projects.csv",
                "project_code,project_name,ministry_id,sector_id,agency_id,state,district,"
                        + "approved_cost,revised_cost,current_expenditure,approval_date,original_start_date,"
                        + "original_completion_date,revised_completion_date,physical_progress,"
                        + "financial_progress,status\n"
                        + "NH-998,Bad Progress,1,1,1,Assam,Dibrugarh,500.00,550.00,10.00,"
                        + "2026-01-05,2026-02-01,2029-01-31,2029-01-31,140.00,5.00,ONGOING\n"),
                false);

        assertEquals("FAILED", result.get("status"));
        assertTrue(projectRepository.findByProjectCode("NH-998").isEmpty());
    }

    @Test
    @DisplayName("A prediction row with an unknown risk level is rejected")
    void rejectsUnknownRiskLevel() {
        Map<String, Object> result = dataImportService.importPredictions(csv("predictions.csv",
                "project_id,cost_overrun_probability,time_overrun_probability,overall_risk_score,risk_level\n"
                        + projectId + ",0.5,0.5,50.00,CATASTROPHIC\n"), null, false);

        assertEquals("FAILED", result.get("status"));
        @SuppressWarnings("unchecked")
        List<String> errors = (List<String>) result.get("validationErrors");
        assertTrue(errors.get(0).contains("risk_level"), errors.get(0));
    }

    @Test
    @DisplayName("The column template advertises the required headers")
    void exposesColumnTemplate() {
        Map<String, List<String>> templates = dataImportService.columnTemplates();
        assertTrue(templates.containsKey("projects"));
        assertTrue(templates.containsKey("monthly-data"));
        assertTrue(templates.get("projects").contains("project_code"));
        assertTrue(templates.get("monthly-data").contains("actual_physical_progress"));
        assertFalse(templates.get("predictions").isEmpty());
    }
}
