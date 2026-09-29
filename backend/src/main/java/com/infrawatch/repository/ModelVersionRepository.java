package com.infrawatch.repository;

import com.infrawatch.entity.ModelVersion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ModelVersionRepository extends JpaRepository<ModelVersion, Long> {

    Optional<ModelVersion> findFirstByIsActiveTrueOrderByIdDesc();

    Optional<ModelVersion> findByVersion(String version);

    List<ModelVersion> findAllByOrderByIdDesc();
}
