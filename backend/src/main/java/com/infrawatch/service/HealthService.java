package com.infrawatch.service;

import com.infrawatch.client.MlServiceClient;
import com.infrawatch.dto.HealthResponseDto;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class HealthService {

    private final MlServiceClient mlServiceClient;

    public HealthService(MlServiceClient mlServiceClient) {
        this.mlServiceClient = mlServiceClient;
    }

    public HealthResponseDto getBackendHealth() {
        Map<String, Object> details = new HashMap<>();
        details.put("database", "UP");
        details.put("mode", "Development / Health Checked");
        return new HealthResponseDto("UP", "InfraWatch Spring Boot Backend", "1.0.0", details);
    }

    public Map<String, Object> getMlServiceHealth() {
        return mlServiceClient.checkMlServiceHealth();
    }
}
