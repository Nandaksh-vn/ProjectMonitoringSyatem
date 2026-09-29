package com.infrawatch.service;

import com.infrawatch.client.MlIntegrationService;
import com.infrawatch.dto.HealthResponseDto;
import com.infrawatch.repository.ProjectRepository;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class HealthService {

    private final MlIntegrationService mlIntegrationService;
    private final ProjectRepository projectRepository;

    public HealthService(MlIntegrationService mlIntegrationService, ProjectRepository projectRepository) {
        this.mlIntegrationService = mlIntegrationService;
        this.projectRepository = projectRepository;
    }

    /**
     * Reports real component state.
     *
     * <p>The previous version hard-coded {@code database: UP} without opening a
     * connection, so a dead database still produced a healthy response.
     */
    public HealthResponseDto getBackendHealth() {
        Map<String, Object> details = new LinkedHashMap<>();
        String databaseStatus;
        try {
            long projects = projectRepository.count();
            databaseStatus = "UP";
            details.put("projectCount", projects);
        } catch (Exception e) {
            databaseStatus = "DOWN";
            details.put("databaseError", e.getMessage());
        }
        details.put("database", databaseStatus);

        Map<String, Object> mlHealth = mlIntegrationService.checkHealth();
        String mlStatus = String.valueOf(mlHealth.getOrDefault("status", "UNKNOWN")).toUpperCase();
        details.put("mlService", mlStatus);
        details.put("mlModelsLoaded", mlHealth.getOrDefault("models_loaded", false));
        details.put("mlModelVersion", mlHealth.getOrDefault("model_version", "unknown"));

        String overall = "UP".equals(databaseStatus) ? "UP" : "DOWN";
        return new HealthResponseDto(overall, "InfraWatch Spring Boot Backend", "1.1.0", details);
    }

    public Map<String, Object> getMlServiceHealth() {
        return mlIntegrationService.checkHealth();
    }
}
