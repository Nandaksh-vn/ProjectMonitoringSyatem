package com.infrawatch.controller;

import com.infrawatch.entity.Alert;
import com.infrawatch.repository.AlertRepository;
import com.infrawatch.service.RecommendationEngineService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/v1/alerts")
public class AlertController {

    public AlertController(AlertRepository alertRepository, RecommendationEngineService recommendationEngineService) {
        this.alertRepository = alertRepository;
        this.recommendationEngineService = recommendationEngineService;
    }


    private final AlertRepository alertRepository;

    private final RecommendationEngineService recommendationEngineService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROJECT_MANAGER', 'ROLE_ANALYST', 'ROLE_VIEWER', 'ROLE_MONITOR')")
    public ResponseEntity<List<Alert>> getAllAlerts() {
        return ResponseEntity.ok(alertRepository.findAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROJECT_MANAGER', 'ROLE_ANALYST', 'ROLE_VIEWER', 'ROLE_MONITOR')")
    public ResponseEntity<Alert> getAlertById(@PathVariable Long id) {
        return alertRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/project/{projectId}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROJECT_MANAGER', 'ROLE_ANALYST', 'ROLE_VIEWER', 'ROLE_MONITOR')")
    public ResponseEntity<List<Alert>> getProjectAlerts(@PathVariable Long projectId) {
        return ResponseEntity.ok(alertRepository.findByProjectId(projectId));
    }

    @PatchMapping("/{id}/resolve")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROJECT_MANAGER', 'ROLE_MONITOR')")
    public ResponseEntity<Alert> resolveAlert(@PathVariable Long id) {
        return alertRepository.findById(id).map(alert -> {
            alert.setResolvedStatus(true);
            alert.setResolvedAt(java.time.LocalDateTime.now());
            return ResponseEntity.ok(alertRepository.save(alert));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/run")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN')")
    public ResponseEntity<String> runEngine() {
        recommendationEngineService.runEngine();
        return ResponseEntity.ok("Alert and Recommendation Engine executed successfully.");
    }
}
