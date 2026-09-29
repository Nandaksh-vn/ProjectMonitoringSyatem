package com.infrawatch.controller;

import com.infrawatch.entity.RiskFactor;
import com.infrawatch.repository.RiskFactorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/v1/predictions")
public class PredictionController {

    @Autowired
    private RiskFactorRepository riskFactorRepository;

    @GetMapping("/{predictionId}/risk-factors")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROJECT_MANAGER', 'ROLE_ANALYST', 'ROLE_VIEWER', 'ROLE_MONITOR')")
    public ResponseEntity<List<RiskFactor>> getRiskFactors(@PathVariable Long predictionId) {
        return ResponseEntity.ok(riskFactorRepository.findByPredictionId(predictionId));
    }
}
