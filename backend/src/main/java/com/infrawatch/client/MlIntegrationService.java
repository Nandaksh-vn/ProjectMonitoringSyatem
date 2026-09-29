package com.infrawatch.client;

import com.infrawatch.dto.MlPredictionRequest;
import com.infrawatch.dto.MlPredictionResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * HTTP client for the Python ML service.
 *
 * <p>Replaces a stub whose prediction method was commented out and returned null.
 * All calls fail soft: the caller receives an empty {@link Optional} or a
 * DOWN-status map rather than an exception, so a stopped ML container degrades
 * the prediction feature instead of taking down the API.
 */
@Component
public class MlIntegrationService {

    private static final Logger logger = LoggerFactory.getLogger(MlIntegrationService.class);

    private final RestTemplate restTemplate;
    private final String mlServiceUrl;

    public MlIntegrationService(RestTemplate restTemplate,
                                @Value("${ml.service.url}") String mlServiceUrl) {
        this.restTemplate = restTemplate;
        this.mlServiceUrl = mlServiceUrl;
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> checkHealth() {
        try {
            return restTemplate.getForObject(mlServiceUrl + "/health", Map.class);
        } catch (RestClientException e) {
            logger.warn("ML service health probe failed: {}", e.getMessage());
            Map<String, Object> fallback = new HashMap<>();
            fallback.put("status", "DOWN");
            fallback.put("models_loaded", false);
            fallback.put("error", e.getMessage());
            fallback.put("targetUrl", mlServiceUrl);
            return fallback;
        }
    }

    public boolean isAvailable() {
        Object loaded = checkHealth().get("models_loaded");
        return Boolean.TRUE.equals(loaded);
    }

    /**
     * Requests cost, schedule, overall-risk and SHAP output in a single call.
     *
     * @return the populated response, or empty when the service is unreachable
     *         or returned an incomplete payload
     */
    public Optional<MlPredictionResponse> predictFull(MlPredictionRequest request) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            MlPredictionResponse response = restTemplate.postForObject(
                    mlServiceUrl + "/ml/predict/full",
                    new HttpEntity<>(request, headers),
                    MlPredictionResponse.class);

            if (response == null || !response.isComplete()) {
                logger.warn("ML service returned an incomplete prediction payload for project {}",
                        request.getProjectId());
                return Optional.empty();
            }
            return Optional.of(response);
        } catch (RestClientException e) {
            logger.warn("ML prediction call failed for project {}: {}",
                    request.getProjectId(), e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Proxies the ML service experiment table for the Model Performance screen.
     * The frontend used to call the ML service directly from the browser, which
     * bypasses CORS and breaks behind a reverse proxy; routing it through the
     * backend keeps a single outbound dependency.
     */
    @SuppressWarnings("unchecked")
    public Optional<Map<String, Object>> modelPerformance() {
        try {
            Map<String, Object> body = restTemplate.getForObject(mlServiceUrl + "/model-performance", Map.class);
            return Optional.ofNullable(body);
        } catch (RestClientException e) {
            logger.warn("ML model-performance fetch failed: {}", e.getMessage());
            return Optional.empty();
        }
    }
}
