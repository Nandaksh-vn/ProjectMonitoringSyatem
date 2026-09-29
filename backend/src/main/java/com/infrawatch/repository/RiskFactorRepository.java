package com.infrawatch.repository;

import com.infrawatch.entity.RiskFactor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RiskFactorRepository extends JpaRepository<RiskFactor, Long> {
    List<RiskFactor> findByPredictionId(Long predictionId);

    @org.springframework.data.jpa.repository.Query("SELECT r FROM RiskFactor r, Prediction p WHERE r.predictionId = p.id AND p.projectId = :projectId")
    List<RiskFactor> findByProjectId(@org.springframework.data.repository.query.Param("projectId") Long projectId);
}
