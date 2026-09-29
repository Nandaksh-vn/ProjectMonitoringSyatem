package com.infrawatch.controller;

import com.infrawatch.entity.Project;
import com.infrawatch.repository.ProjectRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.infrawatch.repository.SectorRepository;
import com.infrawatch.entity.Sector;

@RestController
@RequestMapping("/v1/public")
public class PublicController {

    public PublicController(
            ProjectRepository projectRepository, 
            SectorRepository sectorRepository,
            com.infrawatch.repository.MilestoneRepository milestoneRepository,
            com.infrawatch.repository.PredictionRepository predictionRepository) {
        this.projectRepository = projectRepository;
        this.sectorRepository = sectorRepository;
        this.milestoneRepository = milestoneRepository;
        this.predictionRepository = predictionRepository;
    }


    private final ProjectRepository projectRepository;

    private final SectorRepository sectorRepository;
    
    private final com.infrawatch.repository.MilestoneRepository milestoneRepository;

    private final com.infrawatch.repository.PredictionRepository predictionRepository;

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getPublicStats() {
        List<Project> allProjects = projectRepository.findAll();
        List<Sector> allSectors = sectorRepository.findAll();
        
        Map<Long, String> sectorNameMap = new HashMap<>();
        for (Sector s : allSectors) {
            sectorNameMap.put(s.getId(), s.getName());
        }
        
        long totalProjects = allProjects.size();
        long ongoingProjects = allProjects.stream().filter(p -> "ONGOING".equalsIgnoreCase(p.getStatus()) || "ON_TRACK".equalsIgnoreCase(p.getStatus()) || "DELAYED".equalsIgnoreCase(p.getStatus()) || "AT_RISK".equalsIgnoreCase(p.getStatus()) || "CRITICAL".equalsIgnoreCase(p.getStatus())).count();
        long completedProjects = allProjects.stream().filter(p -> "COMPLETED".equalsIgnoreCase(p.getStatus())).count();
        
        // Count by sector
        Map<String, Long> sectorCounts = new HashMap<>();
        for (Project p : allProjects) {
            String sectorName = p.getSectorId() != null ? sectorNameMap.getOrDefault(p.getSectorId(), "Sector " + p.getSectorId()) : "Unknown Sector";
            sectorCounts.put(sectorName, sectorCounts.getOrDefault(sectorName, 0L) + 1);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("totalProjects", totalProjects);
        response.put("ongoingProjects", ongoingProjects);
        response.put("completedProjects", completedProjects);
        response.put("projectsBySector", sectorCounts);
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/projects")
    public ResponseEntity<List<Project>> getPublicProjects() {
        return ResponseEntity.ok(projectRepository.findAll());
    }

    @GetMapping("/sectors")
    public ResponseEntity<List<Sector>> getPublicSectors() {
        return ResponseEntity.ok(sectorRepository.findAll());
    }

    @GetMapping("/projects/{id}")
    public ResponseEntity<Project> getPublicProjectById(@org.springframework.web.bind.annotation.PathVariable Long id) {
        return projectRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/projects/{id}/milestones")
    public ResponseEntity<List<com.infrawatch.entity.Milestone>> getPublicMilestones(@org.springframework.web.bind.annotation.PathVariable Long id) {
        return ResponseEntity.ok(milestoneRepository.findByProjectId(id));
    }

    @GetMapping("/projects/{id}/predictions")
    public ResponseEntity<List<com.infrawatch.entity.Prediction>> getPublicPredictions(@org.springframework.web.bind.annotation.PathVariable Long id) {
        return ResponseEntity.ok(predictionRepository.findByProjectIdOrderByPredictionDateDesc(id));
    }

    /**
     * Aggregated monitoring report for the public Reports screen.
     *
     * <p>Everything here is derived from live rows, so the page cannot drift from the
     * database the way a hard-coded summary would. Only the latest prediction per
     * project is counted, otherwise a project that has been scored weekly would be
     * weighted more heavily than one scored once.
     */
    @GetMapping("/reports")
    public ResponseEntity<Map<String, Object>> getPublicReport() {
        List<Project> projects = projectRepository.findAll();
        List<Sector> sectors = sectorRepository.findAll();

        Map<Long, String> sectorNames = new HashMap<>();
        for (Sector sector : sectors) {
            sectorNames.put(sector.getId(), sector.getName());
        }

        // Latest prediction per project, keyed by project id.
        Map<Long, com.infrawatch.entity.Prediction> latest = new HashMap<>();
        for (com.infrawatch.entity.Prediction prediction : predictionRepository.findAll()) {
            latest.merge(prediction.getProjectId(), prediction,
                    (a, b) -> isNewer(b, a) ? b : a);
        }

        Map<String, Long> riskDistribution = new LinkedHashMap<>();
        for (String level : List.of("CRITICAL", "HIGH", "MEDIUM", "LOW")) {
            riskDistribution.put(level, 0L);
        }

        Map<String, SectorSummary> bySector = new LinkedHashMap<>();
        List<ProjectRisk> rankedProjects = new ArrayList<>();
        BigDecimal totalApproved = BigDecimal.ZERO;
        BigDecimal totalRevised = BigDecimal.ZERO;
        BigDecimal totalExpenditure = BigDecimal.ZERO;
        int scoredProjects = 0;

        for (Project project : projects) {
            totalApproved = totalApproved.add(nz(project.getApprovedCost()));
            totalRevised = totalRevised.add(nz(project.getRevisedCost()));
            totalExpenditure = totalExpenditure.add(nz(project.getCurrentExpenditure()));

            String sectorName = sectorNames.getOrDefault(project.getSectorId(), "Unknown sector");
            SectorSummary summary = bySector.computeIfAbsent(sectorName, name -> {
                SectorSummary created = new SectorSummary();
                created.name = name;
                return created;
            });
            summary.projectCount++;
            summary.approvedCost = summary.approvedCost.add(nz(project.getApprovedCost()));
            summary.revisedCost = summary.revisedCost.add(nz(project.getRevisedCost()));
            summary.expenditure = summary.expenditure.add(nz(project.getCurrentExpenditure()));
            summary.physicalProgress = summary.physicalProgress.add(nz(project.getPhysicalProgress()));

            com.infrawatch.entity.Prediction prediction = latest.get(project.getId());
            if (prediction == null) {
                continue;
            }
            scoredProjects++;
            riskDistribution.merge(prediction.getRiskLevel(), 1L, Long::sum);
            summary.scoredCount++;
            summary.riskScoreSum = summary.riskScoreSum.add(nz(prediction.getOverallRiskScore()));
            summary.costOverrunProbabilitySum =
                    summary.costOverrunProbabilitySum.add(nz(prediction.getCostOverrunProbability()));
            summary.timeOverrunProbabilitySum =
                    summary.timeOverrunProbabilitySum.add(nz(prediction.getTimeOverrunProbability()));

            ProjectRisk atRisk = new ProjectRisk();
            atRisk.projectId = project.getId();
            atRisk.projectCode = project.getProjectCode();
            atRisk.projectName = project.getProjectName();
            atRisk.sector = sectorName;
            atRisk.riskLevel = prediction.getRiskLevel();
            atRisk.overallRiskScore = nz(prediction.getOverallRiskScore());
            atRisk.costOverrunProbability = nz(prediction.getCostOverrunProbability());
            atRisk.timeOverrunProbability = nz(prediction.getTimeOverrunProbability());
            atRisk.predictionDate = prediction.getPredictionDate();
            rankedProjects.add(atRisk);
        }

        rankedProjects.sort(Comparator.comparing((ProjectRisk p) -> p.overallRiskScore).reversed());
        if (rankedProjects.size() > 10) {
            rankedProjects = new ArrayList<>(rankedProjects.subList(0, 10));
        }

        for (SectorSummary summary : bySector.values()) {
            int n = Math.max(summary.scoredCount, 1);
            summary.averageRiskScore = summary.riskScoreSum.divide(BigDecimal.valueOf(n), 2, RoundingMode.HALF_UP);
            summary.averageCostOverrunProbability =
                    summary.costOverrunProbabilitySum.divide(BigDecimal.valueOf(n), 4, RoundingMode.HALF_UP);
            summary.averageTimeOverrunProbability =
                    summary.timeOverrunProbabilitySum.divide(BigDecimal.valueOf(n), 4, RoundingMode.HALF_UP);
            summary.averagePhysicalProgress =
                    summary.physicalProgress.divide(BigDecimal.valueOf(summary.projectCount), 2, RoundingMode.HALF_UP);
            summary.costEscalationPercent = deviationPercent(summary.approvedCost, summary.revisedCost);
            summary.fundUtilisationPercent = ratioPercent(summary.expenditure, summary.revisedCost);
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("generatedAt", java.time.LocalDateTime.now());
        response.put("totalProjects", projects.size());
        response.put("scoredProjects", scoredProjects);
        response.put("riskDistribution", riskDistribution);
        response.put("financials", Map.of(
                "totalApprovedCost", totalApproved,
                "totalRevisedCost", totalRevised,
                "totalExpenditure", totalExpenditure,
                "costEscalationPercent", deviationPercent(totalApproved, totalRevised),
                "fundUtilisationPercent", ratioPercent(totalExpenditure, totalRevised)));
        response.put("sectors", bySector.values().stream()
                .sorted(Comparator.comparing((SectorSummary s) -> s.averageRiskScore).reversed())
                .toList());
        response.put("topAtRiskProjects", rankedProjects);
        response.put("disclaimer",
                "Schedule and overall-risk models are trained on seeded synthetic labels because the source "
                        + "dataset has no schedule ground truth. Treat those predictions as pipeline demonstration "
                        + "output, not as an official assessment of any project.");
        return ResponseEntity.ok(response);
    }

    private static boolean isNewer(com.infrawatch.entity.Prediction candidate,
                                   com.infrawatch.entity.Prediction incumbent) {
        java.time.LocalDateTime a = candidate.getPredictionDate();
        java.time.LocalDateTime b = incumbent.getPredictionDate();
        if (a == null) return false;
        if (b == null) return true;
        return a.isAfter(b);
    }

    private static BigDecimal nz(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    /**
     * Signed-free magnitude of change between a baseline and a later value,
     * expressed as a percentage of the baseline. Used for escalation/drift only.
     */
    private static BigDecimal deviationPercent(BigDecimal base, BigDecimal value) {
        if (base == null || base.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return nz(value).subtract(base)
                .abs()
                .divide(base, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Direct ratio of a part to a whole, expressed as a percentage.
     * Fund utilisation is spent-over-budget, not a deviation, so it must not
     * use the deviation helper: 3,000 spent against an 11,000 budget is
     * 27.27% utilised, even though it is 72.73% away from the budget figure.
     */
    private static BigDecimal ratioPercent(BigDecimal part, BigDecimal whole) {
        if (whole == null || whole.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return nz(part)
                .divide(whole, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .setScale(2, RoundingMode.HALF_UP);
    }

    /** Aggregated row for one sector in the public report. */
    public static class SectorSummary {
        public String name;
        public int projectCount;
        public int scoredCount;
        public BigDecimal approvedCost = BigDecimal.ZERO;
        public BigDecimal revisedCost = BigDecimal.ZERO;
        public BigDecimal expenditure = BigDecimal.ZERO;
        public BigDecimal physicalProgress = BigDecimal.ZERO;
        public BigDecimal averagePhysicalProgress;
        public BigDecimal riskScoreSum = BigDecimal.ZERO;
        public BigDecimal costOverrunProbabilitySum = BigDecimal.ZERO;
        public BigDecimal timeOverrunProbabilitySum = BigDecimal.ZERO;
        public BigDecimal averageRiskScore;
        public BigDecimal averageCostOverrunProbability;
        public BigDecimal averageTimeOverrunProbability;
        public BigDecimal costEscalationPercent;
        public BigDecimal fundUtilisationPercent;
    }

    /** One project's latest risk position, for the at-risk table. */
    public static class ProjectRisk {
        public Long projectId;
        public String projectCode;
        public String projectName;
        public String sector;
        public String riskLevel;
        public BigDecimal overallRiskScore;
        public BigDecimal costOverrunProbability;
        public BigDecimal timeOverrunProbability;
        public java.time.LocalDateTime predictionDate;
    }
}
