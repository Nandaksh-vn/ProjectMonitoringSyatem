package com.infrawatch.controller;

import com.infrawatch.dto.HealthResponseDto;
import com.infrawatch.service.HealthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/health")
public class HealthController {

    private final HealthService healthService;

    public HealthController(HealthService healthService) {
        this.healthService = healthService;
    }

    @GetMapping
    public ResponseEntity<HealthResponseDto> getHealth() {
        return ResponseEntity.ok(healthService.getBackendHealth());
    }

    @GetMapping("/ml")
    public ResponseEntity<Map<String, Object>> getMlHealth() {
        return ResponseEntity.ok(healthService.getMlServiceHealth());
    }
}
