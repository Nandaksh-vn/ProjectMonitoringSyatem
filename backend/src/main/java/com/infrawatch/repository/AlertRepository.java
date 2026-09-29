package com.infrawatch.repository;

import com.infrawatch.entity.Alert;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AlertRepository extends JpaRepository<Alert, Long> {
    List<Alert> findByProjectId(Long projectId);
}
