package com.infrawatch.dto;

import java.time.Instant;
import java.util.Map;

public class HealthResponseDto {
    private String status;
    private String service;
    private String version;
    private String timestamp;
    private Map<String, Object> details;

    public HealthResponseDto() {
    }

    public HealthResponseDto(String status, String service, String version, Map<String, Object> details) {
        this.status = status;
        this.service = service;
        this.version = version;
        this.timestamp = Instant.now().toString();
        this.details = details;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getService() {
        return service;
    }

    public void setService(String service) {
        this.service = service;
    }

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }

    public Map<String, Object> getDetails() {
        return details;
    }

    public void setDetails(Map<String, Object> details) {
        this.details = details;
    }
}
