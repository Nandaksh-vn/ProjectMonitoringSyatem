package com.infrawatch.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "predictions")
public class Prediction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(name = "model_version_id")
    private Long modelVersionId;

    @Column(name = "prediction_date", insertable = false, updatable = false)
    private LocalDateTime predictionDate;

    @Column(name = "cost_overrun_probability", nullable = false)
    private BigDecimal costOverrunProbability;

    @Column(name = "predicted_cost_overrun_pct", nullable = false)
    private BigDecimal predictedCostOverrunPct;

    @Column(name = "time_overrun_probability", nullable = false)
    private BigDecimal timeOverrunProbability;

    @Column(name = "predicted_delay_months", nullable = false)
    private BigDecimal predictedDelayMonths;

    @Column(name = "overall_risk_score", nullable = false)
    private BigDecimal overallRiskScore;

    @Column(name = "risk_level", nullable = false)
    private String riskLevel;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }
    public Long getModelVersionId() { return modelVersionId; }
    public void setModelVersionId(Long modelVersionId) { this.modelVersionId = modelVersionId; }
    public LocalDateTime getPredictionDate() { return predictionDate; }
    public void setPredictionDate(LocalDateTime predictionDate) { this.predictionDate = predictionDate; }
    public BigDecimal getCostOverrunProbability() { return costOverrunProbability; }
    public void setCostOverrunProbability(BigDecimal costOverrunProbability) { this.costOverrunProbability = costOverrunProbability; }
    public BigDecimal getPredictedCostOverrunPct() { return predictedCostOverrunPct; }
    public void setPredictedCostOverrunPct(BigDecimal predictedCostOverrunPct) { this.predictedCostOverrunPct = predictedCostOverrunPct; }
    public BigDecimal getTimeOverrunProbability() { return timeOverrunProbability; }
    public void setTimeOverrunProbability(BigDecimal timeOverrunProbability) { this.timeOverrunProbability = timeOverrunProbability; }
    public BigDecimal getPredictedDelayMonths() { return predictedDelayMonths; }
    public void setPredictedDelayMonths(BigDecimal predictedDelayMonths) { this.predictedDelayMonths = predictedDelayMonths; }
    public BigDecimal getOverallRiskScore() { return overallRiskScore; }
    public void setOverallRiskScore(BigDecimal overallRiskScore) { this.overallRiskScore = overallRiskScore; }
    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
