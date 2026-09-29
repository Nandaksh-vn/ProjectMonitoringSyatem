package com.infrawatch.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Component
public class MlServiceClient {

    private final RestTemplate restTemplate;
    private final String mlServiceUrl;

    public MlServiceClient(RestTemplate restTemplate, @Value("${ml.service.url}") String mlServiceUrl) {
        this.restTemplate = restTemplate;
        this.mlServiceUrl = mlServiceUrl;
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> checkMlServiceHealth() {
        try {
            String url = mlServiceUrl + "/api/health";
            return restTemplate.getForObject(url, Map.class);
        } catch (Exception e) {
            Map<String, Object> fallback = new HashMap<>();
            fallback.put("status", "DOWN");
            fallback.put("error", e.getMessage());
            fallback.put("targetUrl", mlServiceUrl);
            return fallback;
        }
    }
}
