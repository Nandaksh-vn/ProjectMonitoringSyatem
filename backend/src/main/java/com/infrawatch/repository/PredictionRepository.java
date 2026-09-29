package com.infrawatch.repository;

import com.infrawatch.entity.Prediction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface PredictionRepository extends JpaRepository<Prediction, Long> {
    List<Prediction> findByProjectIdOrderByPredictionDateDesc(Long projectId);

    /**
     * Newest prediction for each project in one round trip.
     *
     * <p>Without this the list screens had to call the per-project endpoint N times
     * just to show a risk badge, so a portfolio-wide filter either fired hundreds
     * of requests or silently fell back to a constant.
     */
    @Query("SELECT p FROM Prediction p WHERE p.id IN ("
            + "SELECT MAX(p2.id) FROM Prediction p2 GROUP BY p2.projectId)"
            + " ORDER BY p.projectId")
    List<Prediction> findLatestPerProject();
}
