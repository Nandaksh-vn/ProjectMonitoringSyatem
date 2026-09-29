package com.infrawatch.service;

import com.infrawatch.entity.Project;
import com.infrawatch.entity.Prediction;
import com.infrawatch.dto.ProjectDTO;
import com.infrawatch.repository.ProjectRepository;
import com.infrawatch.repository.MinistryRepository;
import com.infrawatch.repository.SectorRepository;
import com.infrawatch.repository.PredictionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ProjectService {

    @Autowired private ProjectRepository projectRepository;
    @Autowired private MinistryRepository ministryRepository;
    @Autowired private SectorRepository sectorRepository;
    @Autowired private PredictionRepository predictionRepository;

    public Page<ProjectDTO> getAllProjects(String search, Pageable pageable) {
        Page<Project> projects;
        if (search != null && !search.isEmpty()) {
            projects = projectRepository.findByProjectNameContainingIgnoreCaseOrProjectCodeContainingIgnoreCase(search, search, pageable);
        } else {
            projects = projectRepository.findAll(pageable);
        }
        return projects.map(this::convertToDTO);
    }

    public Optional<Project> getProjectById(Long id) {
        return projectRepository.findById(id);
    }

    public Project saveProject(Project project) {
        return projectRepository.save(project);
    }

    public void deleteProject(Long id) {
        projectRepository.deleteById(id);
    }

    private ProjectDTO convertToDTO(Project project) {
        String ministryCode = ministryRepository.findById(project.getMinistryId())
                .map(m -> m.getCode())
                .orElse("OTHER");
                
        String sectorCode = sectorRepository.findById(project.getSectorId())
                .map(s -> s.getCode())
                .orElse("OTHER");

        List<Prediction> predictions = predictionRepository.findByProjectIdOrderByPredictionDateDesc(project.getId());
        String riskLevel = predictions.isEmpty() ? "LOW" : predictions.get(0).getRiskLevel();

        return new ProjectDTO(project, sectorCode, ministryCode, predictions, riskLevel);
    }
}
