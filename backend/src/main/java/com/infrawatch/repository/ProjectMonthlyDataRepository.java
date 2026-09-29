package com.infrawatch.repository;

import com.infrawatch.entity.ProjectMonthlyData;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ProjectMonthlyDataRepository extends JpaRepository<ProjectMonthlyData, Long> {
    List<ProjectMonthlyData> findByProjectIdOrderByReportingMonthDesc(Long projectId);

    /**
     * Backs the {@code uk_project_month} upsert used by CSV import, so a re-uploaded
     * month updates the existing snapshot instead of violating the unique constraint.
     */
    Optional<ProjectMonthlyData> findByProjectIdAndReportingMonth(Long projectId, LocalDate reportingMonth);
}
