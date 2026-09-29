package com.infrawatch.service;

import com.infrawatch.entity.*;
import com.infrawatch.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
@ActiveProfiles("test")
public class RecommendationEngineServiceTest {

    @Autowired
    private RecommendationEngineService recommendationEngineService;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ProjectMonthlyDataRepository monthlyDataRepository;

    @Autowired
    private PredictionRepository predictionRepository;

    @Autowired
    private AlertRepository alertRepository;

    @Autowired
    private RecommendationRepository recommendationRepository;

    private Project testProject;

    @BeforeEach
    void setUp() {
        testProject = new Project();
        testProject.setProjectCode("TEST-PROJ-01");
        testProject.setProjectName("Test Project");
        testProject.setMinistryId(1L);
        testProject.setSectorId(1L);
        testProject.setAgencyId(1L);
        testProject.setState("Test State");
        testProject.setDistrict("Test District");
        testProject.setApprovalDate(LocalDate.now().minusYears(1));
        testProject.setOriginalStartDate(LocalDate.now().minusMonths(11));
        testProject.setOriginalCompletionDate(LocalDate.now().plusMonths(1));
        testProject.setPhysicalProgress(new BigDecimal("20.0"));
        testProject.setFinancialProgress(new BigDecimal("15.0"));
        testProject.setStatus("ONGOING");
        testProject.setApprovedCost(new BigDecimal("1000000"));
        testProject.setRevisedCost(new BigDecimal("1200000")); // 20% cost escalation
        testProject.setCurrentExpenditure(new BigDecimal("500000")); // 500k vs 1.2M -> 41.6%
        testProject.setRevisedCompletionDate(LocalDate.now().plusDays(15));
        projectRepository.save(testProject);

        ProjectMonthlyData monthlyData = new ProjectMonthlyData();
        monthlyData.setProjectId(testProject.getId());
        monthlyData.setReportingMonth(LocalDate.now());
        monthlyData.setPlannedPhysicalProgress(new BigDecimal("50.0"));
        monthlyData.setActualPhysicalProgress(new BigDecimal("20.0")); // Gap of 30%, which is > 10%
        monthlyData.setPlannedFinancialProgress(new BigDecimal("50.0"));
        monthlyData.setActualFinancialProgress(new BigDecimal("15.0"));
        monthlyData.setMonthlyExpenditure(new BigDecimal("50000"));
        monthlyData.setCumulativeExpenditure(new BigDecimal("500000"));
        monthlyData.setRevisedCost(new BigDecimal("1200000"));
        monthlyData.setRevisedCompletionDate(LocalDate.now().plusDays(15));
        monthlyData.setMilestonesPlanned(5);
        monthlyData.setMilestonesCompleted(3);
        monthlyData.setMilestonesDelayed(2); // Milestone delay
        monthlyDataRepository.save(monthlyData);

        Prediction prediction = new Prediction();
        prediction.setProjectId(testProject.getId());
        prediction.setPredictionDate(java.time.LocalDateTime.now());
        prediction.setOverallRiskScore(new BigDecimal("80.0")); // High risk > 70
        prediction.setCostOverrunProbability(new BigDecimal("0.85"));
        prediction.setPredictedCostOverrunPct(new BigDecimal("20.0"));
        prediction.setTimeOverrunProbability(new BigDecimal("0.75"));
        prediction.setPredictedDelayMonths(new BigDecimal("2.5"));
        prediction.setRiskLevel("HIGH");
        predictionRepository.save(prediction);
    }

    @Test
    void testEngineRulesAndDuplicatePrevention() {
        // Run engine once
        recommendationEngineService.runEngine();

        List<Alert> alerts = alertRepository.findByProjectId(testProject.getId());
        assertFalse(alerts.isEmpty(), "Alerts should be created");
        assertTrue(alerts.stream().anyMatch(a -> a.getAlertType().equals("Progress Gap")));
        assertTrue(alerts.stream().anyMatch(a -> a.getAlertType().equals("Cost Escalation")));
        assertTrue(alerts.stream().anyMatch(a -> a.getAlertType().equals("Expenditure Mismatch")));
        assertTrue(alerts.stream().anyMatch(a -> a.getAlertType().equals("Milestone Delay")));
        assertTrue(alerts.stream().anyMatch(a -> a.getAlertType().equals("Schedule Risk")));
        assertTrue(alerts.stream().anyMatch(a -> a.getAlertType().equals("High Risk")));

        List<Recommendation> recommendations = recommendationRepository.findByProjectId(testProject.getId());
        assertFalse(recommendations.isEmpty(), "Recommendations should be created");

        int alertCountBefore = alerts.size();
        int recCountBefore = recommendations.size();

        // Run engine again to check duplicate prevention
        recommendationEngineService.runEngine();

        alerts = alertRepository.findByProjectId(testProject.getId());
        assertEquals(alertCountBefore, alerts.size(), "Duplicate prevention failed for alerts");

        recommendations = recommendationRepository.findByProjectId(testProject.getId());
        assertEquals(recCountBefore, recommendations.size(), "Duplicate prevention failed for recommendations");

        // Test alert resolution
        Alert alertToResolve = alerts.get(0);
        alertToResolve.setResolvedStatus(true);
        alertRepository.save(alertToResolve);

        // Run engine again, should recreate the alert since it was resolved
        recommendationEngineService.runEngine();
        alerts = alertRepository.findByProjectId(testProject.getId());
        assertEquals(alertCountBefore + 1, alerts.size(), "Alert not recreated after resolution");
    }
}
