package com.infrawatch.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;

/**
 * Feature payload sent to the Python ML service for one project.
 *
 * <p>Mirrors {@code app/schemas.py::ProjectFeaturesRequest}. Progress values are
 * fractions between 0 and 1, whereas {@code projects.physical_progress} and
 * {@code projects.financial_progress} are stored as percentages between 0 and
 * 100, so {@link com.infrawatch.service.PredictionSyncService} normalises them
 * before this object is built.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class MlPredictionRequest {

    private String projectId;
    private String projectName;

    private double approvedCost;
    private double revisedCost;
    private double currentExpenditure;

    private double physicalProgress;
    private double financialProgress;

    private int milestonesPlanned;
    private int milestonesDelayed;

    private double elapsedDurationMonths;
    private double remainingDurationMonths;

    private Double materialCost;
    private Double laborCost;
    private Double equipmentCost;

    private String sector;
    private String ministry;

    public MlPredictionRequest() {
    }

    // Getters and Setters
    public String getProjectId() { return projectId; }
    public void setProjectId(String projectId) { this.projectId = projectId; }
    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }
    public double getApprovedCost() { return approvedCost; }
    public void setApprovedCost(double approvedCost) { this.approvedCost = approvedCost; }
    public double getRevisedCost() { return revisedCost; }
    public void setRevisedCost(double revisedCost) { this.revisedCost = revisedCost; }
    public double getCurrentExpenditure() { return currentExpenditure; }
    public void setCurrentExpenditure(double currentExpenditure) { this.currentExpenditure = currentExpenditure; }
    public double getPhysicalProgress() { return physicalProgress; }
    public void setPhysicalProgress(double physicalProgress) { this.physicalProgress = physicalProgress; }
    public double getFinancialProgress() { return financialProgress; }
    public void setFinancialProgress(double financialProgress) { this.financialProgress = financialProgress; }
    public int getMilestonesPlanned() { return milestonesPlanned; }
    public void setMilestonesPlanned(int milestonesPlanned) { this.milestonesPlanned = milestonesPlanned; }
    public int getMilestonesDelayed() { return milestonesDelayed; }
    public void setMilestonesDelayed(int milestonesDelayed) { this.milestonesDelayed = milestonesDelayed; }
    public double getElapsedDurationMonths() { return elapsedDurationMonths; }
    public void setElapsedDurationMonths(double elapsedDurationMonths) { this.elapsedDurationMonths = elapsedDurationMonths; }
    public double getRemainingDurationMonths() { return remainingDurationMonths; }
    public void setRemainingDurationMonths(double remainingDurationMonths) { this.remainingDurationMonths = remainingDurationMonths; }
    public Double getMaterialCost() { return materialCost; }
    public void setMaterialCost(Double materialCost) { this.materialCost = materialCost; }
    public Double getLaborCost() { return laborCost; }
    public void setLaborCost(Double laborCost) { this.laborCost = laborCost; }
    public Double getEquipmentCost() { return equipmentCost; }
    public void setEquipmentCost(Double equipmentCost) { this.equipmentCost = equipmentCost; }
    public String getSector() { return sector; }
    public void setSector(String sector) { this.sector = sector; }
    public String getMinistry() { return ministry; }
    public void setMinistry(String ministry) { this.ministry = ministry; }
}
