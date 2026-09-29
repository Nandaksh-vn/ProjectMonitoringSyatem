package com.infrawatch.controller;

import com.infrawatch.entity.Project;
import com.infrawatch.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.infrawatch.repository.SectorRepository;
import com.infrawatch.entity.Sector;

@RestController
@RequestMapping("/v1/public")
public class PublicController {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private SectorRepository sectorRepository;

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getPublicStats() {
        List<Project> allProjects = projectRepository.findAll();
        List<Sector> allSectors = sectorRepository.findAll();
        
        Map<Long, String> sectorNameMap = new HashMap<>();
        for (Sector s : allSectors) {
            sectorNameMap.put(s.getId(), s.getName());
        }
        
        long totalProjects = allProjects.size();
        long ongoingProjects = allProjects.stream().filter(p -> "ONGOING".equalsIgnoreCase(p.getStatus()) || "ON_TRACK".equalsIgnoreCase(p.getStatus()) || "DELAYED".equalsIgnoreCase(p.getStatus()) || "AT_RISK".equalsIgnoreCase(p.getStatus()) || "CRITICAL".equalsIgnoreCase(p.getStatus())).count();
        long completedProjects = allProjects.stream().filter(p -> "COMPLETED".equalsIgnoreCase(p.getStatus())).count();
        
        // Count by sector
        Map<String, Long> sectorCounts = new HashMap<>();
        for (Project p : allProjects) {
            String sectorName = p.getSectorId() != null ? sectorNameMap.getOrDefault(p.getSectorId(), "Sector " + p.getSectorId()) : "Unknown Sector";
            sectorCounts.put(sectorName, sectorCounts.getOrDefault(sectorName, 0L) + 1);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("totalProjects", totalProjects);
        response.put("ongoingProjects", ongoingProjects);
        response.put("completedProjects", completedProjects);
        response.put("projectsBySector", sectorCounts);
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/projects")
    public ResponseEntity<List<Project>> getPublicProjects() {
        return ResponseEntity.ok(projectRepository.findAll());
    }

    @GetMapping("/sectors")
    public ResponseEntity<List<Sector>> getPublicSectors() {
        return ResponseEntity.ok(sectorRepository.findAll());
    }

    @GetMapping("/projects/{id}")
    public ResponseEntity<Project> getPublicProjectById(@org.springframework.web.bind.annotation.PathVariable Long id) {
        return projectRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Autowired
    private com.infrawatch.repository.MilestoneRepository milestoneRepository;

    @Autowired
    private com.infrawatch.repository.PredictionRepository predictionRepository;

    @GetMapping("/projects/{id}/milestones")
    public ResponseEntity<List<com.infrawatch.entity.Milestone>> getPublicMilestones(@org.springframework.web.bind.annotation.PathVariable Long id) {
        return ResponseEntity.ok(milestoneRepository.findByProjectId(id));
    }

    @GetMapping("/projects/{id}/predictions")
    public ResponseEntity<List<com.infrawatch.entity.Prediction>> getPublicPredictions(@org.springframework.web.bind.annotation.PathVariable Long id) {
        return ResponseEntity.ok(predictionRepository.findByProjectIdOrderByPredictionDateDesc(id));
    }
}
