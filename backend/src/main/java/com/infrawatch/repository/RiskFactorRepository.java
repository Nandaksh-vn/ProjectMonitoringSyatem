package com.infrawatch.repository;

import com.infrawatch.entity.RiskFactor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RiskFactorRepository extends JpaRepository<RiskFactor, Long> {

    List<RiskFactor> findByPredictionId(Long predictionId);

    /**
     * Factors for the most recent prediction of a project.
     *
     * <p>Written as a subquery rather than the previous comma cross-join, which
     * scanned every factor row in the table.
     */
    @Query("SELECT r FROM RiskFactor r WHERE r.predictionId = "
            + "(SELECT p.id FROM Prediction p WHERE p.projectId = :projectId "
            + "ORDER BY p.predictionDate DESC, p.id DESC)")
    List<RiskFactor> findLatestByProjectId(@Param("projectId") Long projectId);

    long countByPredictionId(Long predictionId);
}
