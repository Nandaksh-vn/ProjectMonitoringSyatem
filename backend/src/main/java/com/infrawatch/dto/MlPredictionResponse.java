package com.infrawatch.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;

import java.math.BigDecimal;
import java.util.List;

/**
 * Response returned by {@code POST /ml/predict/full} on the Python ML service.
 *
 * <p>Mirrors {@code app/schemas.py::FullPredictionResponse}. Unknown fields are
 * ignored so that adding a field to the ML service cannot break deserialisation
 * on the backend.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class MlPredictionResponse {

    private CostSection cost;
    private TimeSection time;
    private RiskSection risk;
    private ExplanationSection explanation;
    private String modelVersion;

    public boolean isComplete() {
        return cost != null && time != null && risk != null && explanation != null;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public static class CostSection {
        private double costOverrunRiskProbability;
        private int prediction;
        private String modelVersion;
        private String modelName;
        private String dataset;

        public double getCostOverrunRiskProbability() { return costOverrunRiskProbability; }
        public void setCostOverrunRiskProbability(double v) { this.costOverrunRiskProbability = v; }
        public int getPrediction() { return prediction; }
        public void setPrediction(int v) { this.prediction = v; }
        public String getModelVersion() { return modelVersion; }
        public void setModelVersion(String v) { this.modelVersion = v; }
        public String getModelName() { return modelName; }
        public void setModelName(String v) { this.modelName = v; }
        public String getDataset() { return dataset; }
        public void setDataset(String v) { this.dataset = v; }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public static class TimeSection {
        private double timeOverrunProbability;
        private double predictedDelayMonths;
        private int prediction;
        private double delayThresholdMonths;
        private String modelVersion;
        private String modelName;
        private String dataset;

        public double getTimeOverrunProbability() { return timeOverrunProbability; }
        public void setTimeOverrunProbability(double v) { this.timeOverrunProbability = v; }
        public double getPredictedDelayMonths() { return predictedDelayMonths; }
        public void setPredictedDelayMonths(double v) { this.predictedDelayMonths = v; }
        public int getPrediction() { return prediction; }
        public void setPrediction(int v) { this.prediction = v; }
        public double getDelayThresholdMonths() { return delayThresholdMonths; }
        public void setDelayThresholdMonths(double v) { this.delayThresholdMonths = v; }
        public String getModelVersion() { return modelVersion; }
        public void setModelVersion(String v) { this.modelVersion = v; }
        public String getModelName() { return modelName; }
        public void setModelName(String v) { this.modelName = v; }
        public String getDataset() { return dataset; }
        public void setDataset(String v) { this.dataset = v; }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public static class RiskSection {
        private double overallRiskScore;
        private String riskLevel;
        private String modelVersion;
        private String modelName;
        private String dataset;

        public double getOverallRiskScore() { return overallRiskScore; }
        public void setOverallRiskScore(double v) { this.overallRiskScore = v; }
        public String getRiskLevel() { return riskLevel; }
        public void setRiskLevel(String v) { this.riskLevel = v; }
        public String getModelVersion() { return modelVersion; }
        public void setModelVersion(String v) { this.modelVersion = v; }
        public String getModelName() { return modelName; }
        public void setModelName(String v) { this.modelName = v; }
        public String getDataset() { return dataset; }
        public void setDataset(String v) { this.dataset = v; }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public static class ExplanationSection {
        private List<ShapFactor> topFactors;
        private List<ShapFactor> globalImportance;
        private Double baseValue;
        private String disclaimer;
        private String modelVersion;

        public List<ShapFactor> getTopFactors() { return topFactors; }
        public void setTopFactors(List<ShapFactor> v) { this.topFactors = v; }
        public List<ShapFactor> getGlobalImportance() { return globalImportance; }
        public void setGlobalImportance(List<ShapFactor> v) { this.globalImportance = v; }
        public Double getBaseValue() { return baseValue; }
        public void setBaseValue(Double v) { this.baseValue = v; }
        public String getDisclaimer() { return disclaimer; }
        public void setDisclaimer(String v) { this.disclaimer = v; }
        public String getModelVersion() { return modelVersion; }
        public void setModelVersion(String v) { this.modelVersion = v; }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public static class ShapFactor {
        private String factorName;
        private double shapValue;
        private String impactDirection;
        private String description;

        public String getFactorName() { return factorName; }
        public void setFactorName(String v) { this.factorName = v; }
        public double getShapValue() { return shapValue; }
        public void setShapValue(double v) { this.shapValue = v; }
        public String getImpactDirection() { return impactDirection; }
        public void setImpactDirection(String v) { this.impactDirection = v; }
        public String getDescription() { return description; }
        public void setDescription(String v) { this.description = v; }

        /** Normalises the direction string to the vocabulary stored in the database. */
        public String getDirectionCode() {
            if (impactDirection == null) {
                return "INCREASE_RISK";
            }
            return "DECREASE_RISK".equalsIgnoreCase(impactDirection) ? "DECREASE_RISK" : "INCREASE_RISK";
        }

        public BigDecimal getShapValueAsBigDecimal() {
            return BigDecimal.valueOf(shapValue);
        }
    }

    // Getters and Setters
    public CostSection getCost() { return cost; }
    public void setCost(CostSection cost) { this.cost = cost; }
    public TimeSection getTime() { return time; }
    public void setTime(TimeSection time) { this.time = time; }
    public RiskSection getRisk() { return risk; }
    public void setRisk(RiskSection risk) { this.risk = risk; }
    public ExplanationSection getExplanation() { return explanation; }
    public void setExplanation(ExplanationSection explanation) { this.explanation = explanation; }
    public String getModelVersion() { return modelVersion; }
    public void setModelVersion(String modelVersion) { this.modelVersion = modelVersion; }
}
