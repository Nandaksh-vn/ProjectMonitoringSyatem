package com.infrawatch.controller;

import com.infrawatch.entity.Recommendation;
import com.infrawatch.repository.RecommendationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/v1/recommendations")
public class RecommendationController {

    @Autowired
    private RecommendationRepository recommendationRepository;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROJECT_MANAGER', 'ROLE_ANALYST', 'ROLE_VIEWER', 'ROLE_MONITOR')")
    public ResponseEntity<List<Recommendation>> getAllRecommendations() {
        return ResponseEntity.ok(recommendationRepository.findAll());
    }
}
