package com.infrawatch.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class MlIntegrationService {

    private final RestTemplate restTemplate;
    
    @Value("${ml.service.url:http://localhost:8000}")
    private String mlServiceUrl;

    public MlIntegrationService() {
        this.restTemplate = new RestTemplate();
    }

    // Method to call Python ML service in the future
    public Object getPredictionForProject(Long projectId) {
        // String url = mlServiceUrl + "/predict/" + projectId;
        // return restTemplate.getForObject(url, Object.class);
        return null; // Prepared for future implementation
    }
}
