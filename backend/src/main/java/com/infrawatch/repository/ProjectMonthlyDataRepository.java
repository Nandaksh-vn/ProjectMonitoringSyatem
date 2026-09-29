package com.infrawatch.repository;

import com.infrawatch.entity.ProjectMonthlyData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectMonthlyDataRepository extends JpaRepository<ProjectMonthlyData, Long> {
    List<ProjectMonthlyData> findByProjectIdOrderByReportingMonthDesc(Long projectId);
}
