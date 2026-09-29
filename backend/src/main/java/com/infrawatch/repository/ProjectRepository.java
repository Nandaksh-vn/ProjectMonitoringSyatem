package com.infrawatch.repository;

import com.infrawatch.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    Page<Project> findByProjectNameContainingIgnoreCaseOrProjectCodeContainingIgnoreCase(String name, String code, Pageable pageable);
}
