package com.infrawatch.service;

import com.infrawatch.client.MlIntegrationService;
import com.infrawatch.dto.MlPredictionRequest;
import com.infrawatch.dto.MlPredictionResponse;
import com.infrawatch.entity.Milestone;
import com.infrawatch.entity.ModelVersion;
import com.infrawatch.entity.Prediction;
import com.infrawatch.entity.Project;
import com.infrawatch.entity.ProjectMonthlyData;
import com.infrawatch.entity.RiskFactor;
import com.infrawatch.entity.Sector;
import com.infrawatch.repository.MilestoneRepository;
import com.infrawatch.repository.ModelVersionRepository;
import com.infrawatch.repository.PredictionRepository;
import com.infrawatch.repository.ProjectMonthlyDataRepository;
import com.infrawatch.repository.ProjectRepository;
import com.infrawatch.repository.RiskFactorRepository;
import com.infrawatch.repository.SectorRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Bridges the ML service and the database.
 *
 * <p>Before this existed the backend only ever health-probed the ML service, so
 * every row in {@code predictions} and {@code risk_factors} was hand-written seed
 * data and no prediction could ever be generated at runtime.
 */
@Service
public class PredictionSyncService {

    private static final Logger logger = LoggerFactory.getLogger(PredictionSyncService.class);

    private final MlIntegrationService mlService;
    private final ProjectRepository projectRepository;
    private final PredictionRepository predictionRepository;
    private final RiskFactorRepository riskFactorRepository;
    private final ProjectMonthlyDataRepository monthlyDataRepository;
    private final MilestoneRepository milestoneRepository;
    private final SectorRepository sectorRepository;
    private final ModelVersionRepository modelVersionRepository;

    public PredictionSyncService(MlIntegrationService mlService,
                                 ProjectRepository projectRepository,
                                 PredictionRepository predictionRepository,
                                 RiskFactorRepository riskFactorRepository,
                                 ProjectMonthlyDataRepository monthlyDataRepository,
                                 MilestoneRepository milestoneRepository,
                                 SectorRepository sectorRepository,
                                 ModelVersionRepository modelVersionRepository) {
        this.mlService = mlService;
        this.projectRepository = projectRepository;
        this.predictionRepository = predictionRepository;
        this.riskFactorRepository = riskFactorRepository;
        this.monthlyDataRepository = monthlyDataRepository;
        this.milestoneRepository = milestoneRepository;
        this.sectorRepository = sectorRepository;
        this.modelVersionRepository = modelVersionRepository;
    }

    public boolean isMlServiceAvailable() {
        return mlService.isAvailable();
    }

    /** Runs inference for every project and persists the results. */
    public Map<String, Object> syncAllProjects() {
        Map<String, Object> summary = new HashMap<>();
        List<Project> projects = projectRepository.findAll();

        if (!mlService.isAvailable()) {
            logger.warn("Prediction sync skipped: ML service is not reachable or has no models loaded");
            summary.put("status", "ML_UNAVAILABLE");
            summary.put("message", "ML service is not reachable or has no models loaded. No predictions were written.");
            summary.put("projectsProcessed", 0);
            summary.put("predictionsCreated", 0);
            summary.put("failed", List.of());
            return summary;
        }

        List<String> failures = new ArrayList<>();
        int created = 0;
        int skipped = 0;

        for (Project project : projects) {
            try {
                if (syncProject(project.getId())) {
                    created++;
                } else {
                    skipped++;
                }
            } catch (Exception e) {
                failures.add(project.getProjectCode() + ": " + e.getMessage());
                logger.warn("Prediction sync failed for project {}: {}", project.getProjectCode(), e.getMessage());
            }
        }

        summary.put("status", failures.isEmpty() ? "COMPLETED" : "PARTIAL");
        summary.put("projectsProcessed", projects.size());
        summary.put("predictionsCreated", created);
        summary.put("projectsSkipped", skipped);
        summary.put("failed", failures);
        return summary;
    }

    /**
     * Runs inference for one project.
     *
     * @return true when a new prediction row was written
     */
    @Transactional
    public boolean syncProject(Long projectId) {
        Optional<Project> projectOpt = projectRepository.findById(projectId);
        if (projectOpt.isEmpty()) {
            throw new RuntimeException("Project " + projectId + " not found");
        }
        Project project = projectOpt.get();

        MlPredictionRequest request = buildRequest(project);

        Optional<MlPredictionResponse> responseOpt = mlService.predictFull(request);
        if (responseOpt.isEmpty()) {
            return false;
        }

        MlPredictionResponse ml = responseOpt.get();
        Prediction prediction = new Prediction();
        prediction.setProjectId(project.getId());
        prediction.setModelVersionId(resolveModelVersionId(ml.getModelVersion()));
        prediction.setCostOverrunProbability(scale(ml.getCost().getCostOverrunRiskProbability(), 4));
        prediction.setPredictedCostOverrunPct(estimateCostOverrunPct(project, ml));
        prediction.setTimeOverrunProbability(scale(ml.getTime().getTimeOverrunProbability(), 4));
        prediction.setPredictedDelayMonths(scale(ml.getTime().getPredictedDelayMonths(), 2));
        prediction.setOverallRiskScore(scale(ml.getRisk().getOverallRiskScore(), 2));
        prediction.setRiskLevel(ml.getRisk().getRiskLevel());

        Prediction saved = predictionRepository.save(prediction);

        persistRiskFactors(saved, ml);

        logger.info("Synced prediction for project {}: risk={} level={} factors={}",
                project.getProjectCode(), saved.getOverallRiskScore(), saved.getRiskLevel(),
                ml.getExplanation().getTopFactors().size());
        return true;
    }

    private void persistRiskFactors(Prediction prediction, MlPredictionResponse ml) {
        List<MlPredictionResponse.ShapFactor> factors = ml.getExplanation().getTopFactors();
        if (factors == null || factors.isEmpty()) {
            return;
        }

        // Replace the previous attribution rather than accumulating duplicates.
        List<RiskFactor> previous = riskFactorRepository.findByPredictionId(prediction.getId());
        if (!previous.isEmpty()) {
            riskFactorRepository.deleteAll(previous);
        }

        for (MlPredictionResponse.ShapFactor factor : factors) {
            RiskFactor entity = new RiskFactor();
            entity.setPredictionId(prediction.getId());
            entity.setFactorName(factor.getFactorName());
            entity.setShapValue(scale(factor.getShapValue(), 4));
            entity.setImpactDirection(factor.getDirectionCode());
            entity.setFactorDescription(factor.getDescription());
            riskFactorRepository.save(entity);
        }
    }

    /**
     * Maps the ML service version string onto a {@code model_versions} row,
     * creating it on first sight so provenance is never null.
     */
    private Long resolveModelVersionId(String mlVersion) {
        String version = (mlVersion == null || mlVersion.isBlank()) ? "unknown" : mlVersion;
        return modelVersionRepository.findByVersion(version)
                .map(ModelVersion::getId)
                .orElseGet(() -> {
                    ModelVersion entity = new ModelVersion();
                    entity.setModelName("infrawatch-ml-bundle");
                    entity.setModelType("MULTI_TARGET");
                    entity.setVersion(version);
                    entity.setDatasetVersion("see-model-comparison-report");
                    entity.setIsActive(true);
                    return modelVersionRepository.save(entity).getId();
                });
    }

    MlPredictionRequest buildRequest(Project project) {
        MlPredictionRequest request = new MlPredictionRequest();
        request.setProjectId(project.getProjectCode());
        request.setProjectName(project.getProjectName());
        request.setApprovedCost(toDouble(project.getApprovedCost()));
        request.setRevisedCost(toDouble(project.getRevisedCost()));
        request.setCurrentExpenditure(toDouble(project.getCurrentExpenditure()));

        request.setPhysicalProgress(toFraction(project.getPhysicalProgress()));
        request.setFinancialProgress(toFraction(project.getFinancialProgress()));

        Optional<ProjectMonthlyData> latest = latestMonthlyData(project.getId());
        latest.ifPresent(data -> {
            // Prefer the reporting-month snapshot when it is fresher than the project row.
            if (data.getActualPhysicalProgress() != null
                    && data.getActualPhysicalProgress().compareTo(BigDecimal.ZERO) > 0) {
                request.setPhysicalProgress(toFraction(data.getActualPhysicalProgress()));
            }
            if (data.getActualFinancialProgress() != null
                    && data.getActualFinancialProgress().compareTo(BigDecimal.ZERO) > 0) {
                request.setFinancialProgress(toFraction(data.getActualFinancialProgress()));
            }
            if (data.getRevisedCost() != null
                    && data.getRevisedCost().compareTo(BigDecimal.ZERO) > 0) {
                request.setRevisedCost(toDouble(data.getRevisedCost()));
            }
        });

        applyMilestoneCounts(project.getId(), request);

        LocalDate asOf = latest.map(ProjectMonthlyData::getReportingMonth).orElse(LocalDate.now());
        request.setElapsedDurationMonths(monthsBetween(project.getOriginalStartDate(), asOf));
        request.setRemainingDurationMonths(monthsBetween(asOf, project.getRevisedCompletionDate()));

        sectorRepository.findById(project.getSectorId())
                .map(Sector::getCode)
                .ifPresent(request::setSector);

        return request;
    }

    private void applyMilestoneCounts(Long projectId, MlPredictionRequest request) {
        List<Milestone> milestones = milestoneRepository.findByProjectId(projectId);
        if (milestones.isEmpty()) {
            request.setMilestonesPlanned(0);
            request.setMilestonesDelayed(0);
            return;
        }
        long delayed = milestones.stream()
                .filter(m -> m.getDelayDays() != null && m.getDelayDays() > 0)
                .filter(m -> !"COMPLETED".equalsIgnoreCase(m.getStatus()))
                .count();
        request.setMilestonesPlanned(milestones.size());
        request.setMilestonesDelayed((int) delayed);
    }

    private Optional<ProjectMonthlyData> latestMonthlyData(Long projectId) {
        List<ProjectMonthlyData> rows =
                monthlyDataRepository.findByProjectIdOrderByReportingMonthDesc(projectId);
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
    }

    /**
     * Cost overrun percentage implied by the model's probability and the money
     * already committed. Kept alongside the probability because the dashboard
     * shows both and the classifier itself produces no magnitude.
     */
    private BigDecimal estimateCostOverrunPct(Project project, MlPredictionResponse ml) {
        double probability = ml.getCost().getCostOverrunRiskProbability();
        BigDecimal approved = project.getApprovedCost() == null ? BigDecimal.ONE : project.getApprovedCost();

        BigDecimal currentRatio = approved.compareTo(BigDecimal.ZERO) == 0
                ? BigDecimal.ZERO
                : project.getCurrentExpenditure().divide(approved, 4, RoundingMode.HALF_UP);

        double currentPct = currentRatio.doubleValue() * 100.0;
        double probabilityAdjusted = currentPct / Math.max(probability, 0.05);
        double capped = Math.min(Math.max(probabilityAdjusted, 0.0), 999.99);
        return BigDecimal.valueOf(capped).setScale(2, RoundingMode.HALF_UP);
    }

    private static double monthsBetween(LocalDate from, LocalDate to) {
        if (from == null || to == null) {
            return 0.0;
        }
        long days = ChronoUnit.DAYS.between(from, to);
        return days <= 0 ? 0.0 : Math.round((days / 30.4375) * 100.0) / 100.0;
    }

    /** Database stores progress as 0-100; the ML contract expects 0-1. */
    private static double toFraction(BigDecimal percentage) {
        if (percentage == null) {
            return 0.0;
        }
        double value = percentage.doubleValue();
        double fraction = value > 1.0 ? value / 100.0 : value;
        return Math.max(0.0, Math.min(1.0, fraction));
    }

    private static double toDouble(BigDecimal value) {
        return value == null ? 0.0 : value.doubleValue();
    }

    private static BigDecimal scale(double value, int scale) {
        return BigDecimal.valueOf(value).setScale(scale, RoundingMode.HALF_UP);
    }

    /** Timestamp of the newest stored prediction, used by the scheduler log. */
    public LocalDateTime lastSyncedAt() {
        List<Prediction> all = predictionRepository.findAll();
        return all.stream()
                .map(Prediction::getPredictionDate)
                .filter(java.util.Objects::nonNull)
                .max(LocalDateTime::compareTo)
                .orElse(null);
    }
}
