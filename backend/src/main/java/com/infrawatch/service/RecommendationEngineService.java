package com.infrawatch.service;

import com.infrawatch.entity.*;
import com.infrawatch.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Service
public class RecommendationEngineService {

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

    // Configurable thresholds
    @org.springframework.beans.factory.annotation.Value("${infrawatch.alert.thresholds.progress-gap:10.0}")
    private BigDecimal progressGapThreshold;

    @org.springframework.beans.factory.annotation.Value("${infrawatch.alert.thresholds.cost-escalation:10.0}")
    private BigDecimal costEscalationThreshold;

    @org.springframework.beans.factory.annotation.Value("${infrawatch.alert.thresholds.high-risk:70.0}")
    private BigDecimal highRiskThreshold;

    public void runEngine() {
        List<Project> projects = projectRepository.findAll();
        for (Project p : projects) {
            evaluateProject(p);
        }
    }

    public void evaluateProject(Project p) {
        List<ProjectMonthlyData> monthlyDataList = monthlyDataRepository.findByProjectIdOrderByReportingMonthDesc(p.getId());
        ProjectMonthlyData currentMonth = monthlyDataList.isEmpty() ? null : monthlyDataList.get(0);
        ProjectMonthlyData previousMonth = monthlyDataList.size() > 1 ? monthlyDataList.get(1) : null;

        List<Prediction> predictions = predictionRepository.findByProjectIdOrderByPredictionDateDesc(p.getId());
        Prediction currentPrediction = predictions.isEmpty() ? null : predictions.get(0);
        Prediction prevPrediction = predictions.size() > 1 ? predictions.get(1) : null;

        // 1. Progress gap
        if (currentMonth != null) {
            BigDecimal gap = currentMonth.getPlannedPhysicalProgress().subtract(currentMonth.getActualPhysicalProgress());
            if (gap.compareTo(progressGapThreshold) > 0) {
                createAlertIfNotExists(p.getId(), "Progress Gap", "MEDIUM",
                        "Significant Progress Gap",
                        "Planned physical progress significantly exceeds actual progress.",
                        gap, progressGapThreshold,
                        "Review resource allocation; review critical-path activities.");
                createRecommendationIfNotExists(p.getId(), "PROGRESS", "Low physical progress", 
                        "Review resource allocation, equipment availability, and critical-path activities.", "HIGH");
            }
        }

        // 2. Progress deterioration
        if (currentMonth != null && previousMonth != null) {
            BigDecimal currentGap = currentMonth.getPlannedPhysicalProgress().subtract(currentMonth.getActualPhysicalProgress());
            BigDecimal prevGap = previousMonth.getPlannedPhysicalProgress().subtract(previousMonth.getActualPhysicalProgress());
            if (currentGap.compareTo(prevGap) > 0) {
                createAlertIfNotExists(p.getId(), "Progress Deterioration", "MEDIUM",
                        "Progress is Deteriorating",
                        "Month-over-month actual progress is worsening compared to plan.",
                        currentGap, prevGap,
                        "Inspect work-package bottlenecks.");
            }
        }

        // 3. Cost escalation
        if (p.getApprovedCost().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal diff = p.getRevisedCost().subtract(p.getApprovedCost());
            BigDecimal pct = diff.divide(p.getApprovedCost(), 4, RoundingMode.HALF_UP).multiply(new BigDecimal("100"));
            if (pct.compareTo(costEscalationThreshold) > 0) {
                createAlertIfNotExists(p.getId(), "Cost Escalation", "HIGH",
                        "Significant Cost Escalation",
                        "Revised cost is significantly above approved cost.",
                        pct, costEscalationThreshold,
                        "Review cost escalation drivers and inspect procurement/contract variations.");
                createRecommendationIfNotExists(p.getId(), "COST", "Cost risk", 
                        "Review cost escalation drivers, inspect procurement/contract variations, and compare original and revised cost.", "HIGH");
            }
        }

        // 4. Expenditure/progress mismatch
        if (currentMonth != null && p.getRevisedCost().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal expPct = p.getCurrentExpenditure().divide(p.getRevisedCost(), 4, RoundingMode.HALF_UP).multiply(new BigDecimal("100"));
            if (expPct.subtract(currentMonth.getActualPhysicalProgress()).compareTo(new BigDecimal("15.0")) > 0) {
                createAlertIfNotExists(p.getId(), "Expenditure Mismatch", "HIGH",
                        "Expenditure vs Progress Mismatch",
                        "High expenditure combined with low physical progress.",
                        expPct, currentMonth.getActualPhysicalProgress(),
                        "Investigate expenditure/progress mismatch; analyze major cost drivers.");
                createRecommendationIfNotExists(p.getId(), "FINANCE", "High expenditure + low progress", 
                        "Investigate expenditure/progress mismatch, review procurement and contract status, and analyze major cost drivers.", "HIGH");
            }
        }

        // 5. Milestone delay
        if (currentMonth != null && currentMonth.getMilestonesDelayed() != null && currentMonth.getMilestonesDelayed() > 0) {
            createAlertIfNotExists(p.getId(), "Milestone Delay", "MEDIUM",
                    "Milestone Delayed",
                    "Planned milestone date has passed without completion.",
                    new BigDecimal(currentMonth.getMilestonesDelayed()), BigDecimal.ZERO,
                    "Review delayed dependencies and pending approvals.");
            createRecommendationIfNotExists(p.getId(), "SCHEDULE", "Milestone delays", 
                    "Review delayed dependencies, review pending approvals, assess critical-path impact.", "MEDIUM");
        }

        // 6. Schedule risk
        if (p.getRevisedCompletionDate() != null && LocalDate.now().isBefore(p.getRevisedCompletionDate())) {
            long daysLeft = ChronoUnit.DAYS.between(LocalDate.now(), p.getRevisedCompletionDate());
            if (currentMonth != null && currentMonth.getActualPhysicalProgress().compareTo(new BigDecimal("80")) < 0 && daysLeft < 30) {
                createAlertIfNotExists(p.getId(), "Schedule Risk", "CRITICAL",
                        "Insufficient Remaining Duration",
                        "Remaining duration is becoming insufficient for the remaining work.",
                        new BigDecimal(daysLeft), new BigDecimal("30"),
                        "Review critical path and assess resource allocation.");
                createRecommendationIfNotExists(p.getId(), "SCHEDULE", "Schedule risk", 
                        "Review critical path, review remaining activities, and assess resource allocation.", "CRITICAL");
            }
        }

        // 7. Risk escalation & 8. High-risk project
        if (currentPrediction != null) {
            if (currentPrediction.getOverallRiskScore().compareTo(highRiskThreshold) > 0) {
                createAlertIfNotExists(p.getId(), "High Risk", "CRITICAL",
                        "High Risk Project",
                        "Overall risk crosses configured high-risk threshold.",
                        currentPrediction.getOverallRiskScore(), highRiskThreshold,
                        "Immediate management review recommended.");
            }

            if (prevPrediction != null) {
                if (currentPrediction.getOverallRiskScore().subtract(prevPrediction.getOverallRiskScore()).compareTo(new BigDecimal("10.0")) > 0) {
                    createAlertIfNotExists(p.getId(), "Risk Escalation", "HIGH",
                            "Risk Escalation",
                            "Overall risk score increases significantly compared to previous prediction.",
                            currentPrediction.getOverallRiskScore(), prevPrediction.getOverallRiskScore(),
                            "Analyze recent predictions and intervene.");
                }
            }
        }
    }

    private void createAlertIfNotExists(Long projectId, String type, String severity, String title, String desc, BigDecimal trigger, BigDecimal threshold, String action) {
        List<Alert> existing = alertRepository.findByProjectId(projectId);
        boolean exists = existing.stream().anyMatch(a -> a.getTitle().equals(title) && Boolean.FALSE.equals(a.getResolvedStatus()));
        if (!exists) {
            Alert alert = new Alert();
            alert.setProjectId(projectId);
            alert.setAlertType(type);
            alert.setSeverity(severity);
            alert.setTitle(title);
            alert.setDescription(desc);
            alert.setTriggerValue(trigger);
            alert.setThresholdValue(threshold);
            alert.setSuggestedAction(action);
            alert.setResolvedStatus(false);
            alertRepository.save(alert);
        }
    }

    private void createRecommendationIfNotExists(Long projectId, String type, String title, String desc, String priority) {
        List<Recommendation> existing = recommendationRepository.findByProjectId(projectId);
        boolean exists = existing.stream().anyMatch(r -> r.getTitle().equals(title) && Boolean.FALSE.equals(r.getActionTakenStatus()));
        if (!exists) {
            Recommendation rec = new Recommendation();
            rec.setProjectId(projectId);
            rec.setRecommendationType(type);
            rec.setTitle(title);
            rec.setDescription(desc);
            rec.setPriorityLevel(priority);
            rec.setActionTakenStatus(false);
            recommendationRepository.save(rec);
        }
    }
}
