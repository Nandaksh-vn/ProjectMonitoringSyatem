package com.infrawatch.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "risk_factors")
public class RiskFactor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "prediction_id", nullable = false)
    private Long predictionId;

    @Column(name = "factor_name", nullable = false)
    private String factorName;

    // Column name in schema.sql is 'impact_value', not 'shap_value'
    @Column(name = "impact_value", nullable = false)
    private BigDecimal shapValue;

    // Column name in schema.sql is 'direction', not 'impact_direction'
    @Column(name = "direction", nullable = false)
    private String impactDirection;

    // Column name in schema.sql is 'description', not 'factor_description'
    @Column(name = "description")
    private String factorDescription;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getPredictionId() { return predictionId; }
    public void setPredictionId(Long predictionId) { this.predictionId = predictionId; }
    public String getFactorName() { return factorName; }
    public void setFactorName(String factorName) { this.factorName = factorName; }
    public BigDecimal getShapValue() { return shapValue; }
    public void setShapValue(BigDecimal shapValue) { this.shapValue = shapValue; }
    public String getImpactDirection() { return impactDirection; }
    public void setImpactDirection(String impactDirection) { this.impactDirection = impactDirection; }
    public String getFactorDescription() { return factorDescription; }
    public void setFactorDescription(String factorDescription) { this.factorDescription = factorDescription; }
}
