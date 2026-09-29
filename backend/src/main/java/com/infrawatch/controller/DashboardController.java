package com.infrawatch.controller;

import com.infrawatch.repository.ProjectRepository;
import com.infrawatch.repository.AlertRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/v1/dashboard")
public class DashboardController {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private AlertRepository alertRepository;

    @GetMapping("/summary")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROJECT_MANAGER', 'ROLE_ANALYST', 'ROLE_VIEWER')")
    public ResponseEntity<Map<String, Object>> getDashboardSummary() {
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalProjects", projectRepository.count());
        summary.put("totalAlerts", alertRepository.count());
        // Calculate more metrics as needed
        return ResponseEntity.ok(summary);
    }
}
