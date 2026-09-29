package com.infrawatch.service;

import com.infrawatch.entity.Project;
import com.infrawatch.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class ProjectService {

    @Autowired
    private ProjectRepository projectRepository;

    public Page<Project> getAllProjects(String search, Pageable pageable) {
        if (search != null && !search.isEmpty()) {
            return projectRepository.findByProjectNameContainingIgnoreCaseOrProjectCodeContainingIgnoreCase(search, search, pageable);
        }
        return projectRepository.findAll(pageable);
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
}
