package com.infrawatch.controller;

import com.infrawatch.entity.*;
import com.infrawatch.dto.ProjectDTO;
import com.infrawatch.repository.*;
import com.infrawatch.service.ProjectService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/v1/projects")
public class ProjectController {

    @Autowired private ProjectService projectService;
    @Autowired private RecommendationRepository recommendationRepository;
    @Autowired private RiskFactorRepository riskFactorRepository;
    @Autowired private ProjectMonthlyDataRepository monthlyDataRepository;
    @Autowired private MilestoneRepository milestoneRepository;
    @Autowired private PredictionRepository predictionRepository;
    @Autowired private AlertRepository alertRepository;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROJECT_MANAGER', 'ROLE_ANALYST', 'ROLE_VIEWER', 'ROLE_MONITOR')")
    public ResponseEntity<Page<ProjectDTO>> getAllProjects(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(projectService.getAllProjects(search, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROJECT_MANAGER', 'ROLE_ANALYST', 'ROLE_VIEWER', 'ROLE_MONITOR')")
    public ResponseEntity<Project> getProjectById(@PathVariable Long id) {
        return projectService.getProjectById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/monthly-data")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROJECT_MANAGER', 'ROLE_ANALYST', 'ROLE_VIEWER', 'ROLE_MONITOR')")
    public ResponseEntity<List<ProjectMonthlyData>> getMonthlyData(@PathVariable Long id) {
        return ResponseEntity.ok(monthlyDataRepository.findByProjectIdOrderByReportingMonthDesc(id));
    }

    @GetMapping("/{id}/milestones")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROJECT_MANAGER', 'ROLE_ANALYST', 'ROLE_VIEWER', 'ROLE_MONITOR')")
    public ResponseEntity<List<Milestone>> getMilestones(@PathVariable Long id) {
        return ResponseEntity.ok(milestoneRepository.findByProjectId(id));
    }

    @GetMapping("/{id}/predictions")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROJECT_MANAGER', 'ROLE_ANALYST', 'ROLE_VIEWER', 'ROLE_MONITOR')")
    public ResponseEntity<List<Prediction>> getPredictions(@PathVariable Long id) {
        return ResponseEntity.ok(predictionRepository.findByProjectIdOrderByPredictionDateDesc(id));
    }

    @GetMapping("/{id}/alerts")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROJECT_MANAGER', 'ROLE_ANALYST', 'ROLE_VIEWER', 'ROLE_MONITOR')")
    public ResponseEntity<List<Alert>> getProjectAlerts(@PathVariable Long id) {
        return ResponseEntity.ok(alertRepository.findByProjectId(id));
    }

    @GetMapping("/{id}/recommendations")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROJECT_MANAGER', 'ROLE_ANALYST', 'ROLE_VIEWER', 'ROLE_MONITOR')")
    public ResponseEntity<List<Recommendation>> getProjectRecommendations(@PathVariable Long id) {
        return ResponseEntity.ok(recommendationRepository.findByProjectId(id));
    }

    @GetMapping("/{id}/risk-factors")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROJECT_MANAGER', 'ROLE_ANALYST', 'ROLE_VIEWER', 'ROLE_MONITOR')")
    public ResponseEntity<List<RiskFactor>> getProjectRiskFactors(@PathVariable Long id) {
        return ResponseEntity.ok(riskFactorRepository.findByProjectId(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN')")
    public ResponseEntity<Project> createProject(@RequestBody Project project) {
        return ResponseEntity.ok(projectService.saveProject(project));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROJECT_MANAGER')")
    public ResponseEntity<Project> updateProject(@PathVariable Long id, @RequestBody Project project) {
        return projectService.getProjectById(id)
                .map(existing -> {
                    project.setId(id);
                    return ResponseEntity.ok(projectService.saveProject(project));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Void> deleteProject(@PathVariable Long id) {
        if (projectService.getProjectById(id).isPresent()) {
            projectService.deleteProject(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
