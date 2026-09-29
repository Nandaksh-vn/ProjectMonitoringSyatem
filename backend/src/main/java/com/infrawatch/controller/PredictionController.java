package com.infrawatch.controller;

import com.infrawatch.client.MlIntegrationService;
import com.infrawatch.entity.ModelVersion;
import com.infrawatch.entity.Prediction;
import com.infrawatch.entity.RiskFactor;
import com.infrawatch.repository.ModelVersionRepository;
import com.infrawatch.repository.PredictionRepository;
import com.infrawatch.repository.RiskFactorRepository;
import com.infrawatch.service.PredictionSyncService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/v1/predictions")
public class PredictionController {

    private final RiskFactorRepository riskFactorRepository;
    private final PredictionRepository predictionRepository;
    private final ModelVersionRepository modelVersionRepository;
    private final PredictionSyncService predictionSyncService;
    private final MlIntegrationService mlService;

    public PredictionController(RiskFactorRepository riskFactorRepository,
                                PredictionRepository predictionRepository,
                                ModelVersionRepository modelVersionRepository,
                                PredictionSyncService predictionSyncService,
                                MlIntegrationService mlService) {
        this.riskFactorRepository = riskFactorRepository;
        this.predictionRepository = predictionRepository;
        this.modelVersionRepository = modelVersionRepository;
        this.predictionSyncService = predictionSyncService;
        this.mlService = mlService;
    }

    @GetMapping("/{predictionId}/risk-factors")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROJECT_MANAGER', 'ROLE_ANALYST', 'ROLE_VIEWER', 'ROLE_MONITOR')")
    public ResponseEntity<List<RiskFactor>> getRiskFactors(@PathVariable Long predictionId) {
        return ResponseEntity.ok(riskFactorRepository.findByPredictionId(predictionId));
    }

    /** Live SHAP attribution for the newest prediction of a project. */
    @GetMapping("/project/{projectId}/latest-risk-factors")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROJECT_MANAGER', 'ROLE_ANALYST', 'ROLE_VIEWER', 'ROLE_MONITOR')")
    public ResponseEntity<List<RiskFactor>> getLatestProjectRiskFactors(@PathVariable Long projectId) {
        return ResponseEntity.ok(riskFactorRepository.findLatestByProjectId(projectId));
    }

    @GetMapping("/project/{projectId}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROJECT_MANAGER', 'ROLE_ANALYST', 'ROLE_VIEWER', 'ROLE_MONITOR')")
    public ResponseEntity<List<Prediction>> getProjectPredictions(@PathVariable Long projectId) {
        return ResponseEntity.ok(predictionRepository.findByProjectIdOrderByPredictionDateDesc(projectId));
    }

    /** Newest prediction per project, so portfolio screens can filter on real risk. */
    @GetMapping("/latest")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROJECT_MANAGER', 'ROLE_ANALYST', 'ROLE_VIEWER', 'ROLE_MONITOR')")
    public ResponseEntity<List<Prediction>> getLatestPerProject() {
        return ResponseEntity.ok(predictionRepository.findLatestPerProject());
    }

    /** Runs ML inference for one project and persists the result. */
    @PostMapping("/project/{projectId}/sync")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROJECT_MANAGER', 'ROLE_ANALYST')")
    public ResponseEntity<Map<String, Object>> syncProject(@PathVariable Long projectId) {
        boolean created = predictionSyncService.syncProject(projectId);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", created ? "COMPLETED" : "SKIPPED");
        body.put("message", created
                ? "Prediction stored."
                : "ML service unavailable; no prediction was written.");
        body.put("projectId", projectId);
        return ResponseEntity.ok(body);
    }

    /** Runs ML inference for the whole portfolio. */
    @PostMapping("/sync")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> syncAll() {
        return ResponseEntity.ok(predictionSyncService.syncAllProjects());
    }

    @GetMapping("/model-versions")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROJECT_MANAGER', 'ROLE_ANALYST', 'ROLE_VIEWER', 'ROLE_MONITOR')")
    public ResponseEntity<List<ModelVersion>> getModelVersions() {
        return ResponseEntity.ok(modelVersionRepository.findAllByOrderByIdDesc());
    }

    /**
     * Proxies the ML service experiment table.
     *
     * <p>Replaces the frontend calling port 8000 directly from the browser, which
     * required permissive CORS on the ML service and broke in the Docker compose
     * topology.
     */
    @GetMapping("/model-performance")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROJECT_MANAGER', 'ROLE_ANALYST', 'ROLE_VIEWER', 'ROLE_MONITOR')")
    public ResponseEntity<?> getModelPerformance() {
        return mlService.modelPerformance()
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(503).body(Map.of(
                        "error", "ML service is unavailable or returned no experiment table.",
                        "status", mlService.checkHealth())));
    }

    /** Ad-hoc inference without persisting, used to sanity-check a change. */
    @PostMapping("/preview")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROJECT_MANAGER', 'ROLE_ANALYST')")
    public ResponseEntity<?> preview(com.infrawatch.dto.MlPredictionRequest request) {
        return mlService.predictFull(request)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(503).body(Map.of(
                        "error", "ML service is unavailable or returned an incomplete payload.")));
    }
}
