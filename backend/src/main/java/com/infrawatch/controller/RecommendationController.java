package com.infrawatch.controller;

import com.infrawatch.entity.Recommendation;
import com.infrawatch.repository.RecommendationRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/v1/recommendations")
public class RecommendationController {

    private final RecommendationRepository recommendationRepository;

    public RecommendationController(RecommendationRepository recommendationRepository) {
        this.recommendationRepository = recommendationRepository;
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROJECT_MANAGER', 'ROLE_ANALYST', 'ROLE_VIEWER', 'ROLE_MONITOR')")
    public ResponseEntity<List<Recommendation>> getAllRecommendations() {
        return ResponseEntity.ok(recommendationRepository.findAll());
    }

    @GetMapping("/project/{projectId}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROJECT_MANAGER', 'ROLE_ANALYST', 'ROLE_VIEWER', 'ROLE_MONITOR')")
    public ResponseEntity<List<Recommendation>> getByProject(@PathVariable Long projectId) {
        return ResponseEntity.ok(recommendationRepository.findByProjectId(projectId));
    }

    /**
     * Records that a recommendation was actioned.
     *
     * <p>Without this the {@code action_taken_status} column could never leave its
     * default of FALSE, so the Recommendations screen had no real state to show
     * and the rules engine treated every resolved item as still outstanding.
     */
    @PatchMapping("/{id}/action")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROJECT_MANAGER', 'ROLE_MONITOR')")
    public ResponseEntity<?> recordAction(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return recommendationRepository.findById(id)
                .map(recommendation -> {
                    Object taken = body.get("actionTaken");
                    boolean actionTaken = taken == null || Boolean.parseBoolean(String.valueOf(taken));
                    recommendation.setActionTakenStatus(actionTaken);
                    recommendation.setActionTakenDetails(
                            body.get("details") != null ? String.valueOf(body.get("details")) : null);
                    recommendation.setUpdatedAt(LocalDateTime.now());
                    Recommendation saved = recommendationRepository.save(recommendation);

                    Map<String, Object> response = new LinkedHashMap<>();
                    response.put("message", actionTaken
                            ? "Recommendation marked as actioned."
                            : "Recommendation reopened.");
                    response.put("recommendation", saved);
                    return ResponseEntity.ok(response);
                })
                .orElseGet(() -> ResponseEntity.status(404).<Map<String, Object>>body(
                        Map.of("message", "Recommendation " + id + " not found.")));
    }
}
