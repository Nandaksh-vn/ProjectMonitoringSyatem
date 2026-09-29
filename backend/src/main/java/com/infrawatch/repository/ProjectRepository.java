package com.infrawatch.repository;

import com.infrawatch.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    Page<Project> findByProjectNameContainingIgnoreCaseOrProjectCodeContainingIgnoreCase(String name, String code, Pageable pageable);

    /** Key used by the CSV import upsert so a re-uploaded project updates in place. */
    Optional<Project> findByProjectCode(String projectCode);

    List<Project> findByStatus(String status);
}
