package com.infrawatch.dto;

import com.infrawatch.entity.Project;
import com.infrawatch.entity.Prediction;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class ProjectDTO {
    private Long id;
    private String projectCode;
    private String projectName;
    private Long ministryId;
    private Long sectorId;
    private Long agencyId;
    private String state;
    private String district;
    private BigDecimal approvedCost;
    private BigDecimal revisedCost;
    private BigDecimal currentExpenditure;
    private LocalDate approvalDate;
    private LocalDate originalStartDate;
    private LocalDate originalCompletionDate;
    private LocalDate revisedCompletionDate;
    private BigDecimal physicalProgress;
    private BigDecimal financialProgress;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Additional fields for Dashboard
    private String sectorCode;
    private String ministryCode;
    private String riskLevel;
    private List<Prediction> predictions;

    public ProjectDTO() {}

    public ProjectDTO(Project p, String sectorCode, String ministryCode, List<Prediction> predictions, String riskLevel) {
        this.id = p.getId();
        this.projectCode = p.getProjectCode();
        this.projectName = p.getProjectName();
        this.ministryId = p.getMinistryId();
        this.sectorId = p.getSectorId();
        this.agencyId = p.getAgencyId();
        this.state = p.getState();
        this.district = p.getDistrict();
        this.approvedCost = p.getApprovedCost();
        this.revisedCost = p.getRevisedCost();
        this.currentExpenditure = p.getCurrentExpenditure();
        this.approvalDate = p.getApprovalDate();
        this.originalStartDate = p.getOriginalStartDate();
        this.originalCompletionDate = p.getOriginalCompletionDate();
        this.revisedCompletionDate = p.getRevisedCompletionDate();
        this.physicalProgress = p.getPhysicalProgress();
        this.financialProgress = p.getFinancialProgress();
        this.status = p.getStatus();
        this.createdAt = p.getCreatedAt();
        this.updatedAt = p.getUpdatedAt();
        
        this.sectorCode = sectorCode;
        this.ministryCode = ministryCode;
        this.predictions = predictions;
        this.riskLevel = riskLevel;
    }

    // Getters
    public Long getId() { return id; }
    public String getProjectCode() { return projectCode; }
    public String getProjectName() { return projectName; }
    public Long getMinistryId() { return ministryId; }
    public Long getSectorId() { return sectorId; }
    public Long getAgencyId() { return agencyId; }
    public String getState() { return state; }
    public String getDistrict() { return district; }
    public BigDecimal getApprovedCost() { return approvedCost; }
    public BigDecimal getRevisedCost() { return revisedCost; }
    public BigDecimal getCurrentExpenditure() { return currentExpenditure; }
    public LocalDate getApprovalDate() { return approvalDate; }
    public LocalDate getOriginalStartDate() { return originalStartDate; }
    public LocalDate getOriginalCompletionDate() { return originalCompletionDate; }
    public LocalDate getRevisedCompletionDate() { return revisedCompletionDate; }
    public BigDecimal getPhysicalProgress() { return physicalProgress; }
    public BigDecimal getFinancialProgress() { return financialProgress; }
    public String getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public String getSectorCode() { return sectorCode; }
    public String getMinistryCode() { return ministryCode; }
    public String getRiskLevel() { return riskLevel; }
    public List<Prediction> getPredictions() { return predictions; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setProjectCode(String projectCode) { this.projectCode = projectCode; }
    public void setProjectName(String projectName) { this.projectName = projectName; }
    public void setMinistryId(Long ministryId) { this.ministryId = ministryId; }
    public void setSectorId(Long sectorId) { this.sectorId = sectorId; }
    public void setAgencyId(Long agencyId) { this.agencyId = agencyId; }
    public void setState(String state) { this.state = state; }
    public void setDistrict(String district) { this.district = district; }
    public void setApprovedCost(BigDecimal approvedCost) { this.approvedCost = approvedCost; }
    public void setRevisedCost(BigDecimal revisedCost) { this.revisedCost = revisedCost; }
    public void setCurrentExpenditure(BigDecimal currentExpenditure) { this.currentExpenditure = currentExpenditure; }
    public void setApprovalDate(LocalDate approvalDate) { this.approvalDate = approvalDate; }
    public void setOriginalStartDate(LocalDate originalStartDate) { this.originalStartDate = originalStartDate; }
    public void setOriginalCompletionDate(LocalDate originalCompletionDate) { this.originalCompletionDate = originalCompletionDate; }
    public void setRevisedCompletionDate(LocalDate revisedCompletionDate) { this.revisedCompletionDate = revisedCompletionDate; }
    public void setPhysicalProgress(BigDecimal physicalProgress) { this.physicalProgress = physicalProgress; }
    public void setFinancialProgress(BigDecimal financialProgress) { this.financialProgress = financialProgress; }
    public void setStatus(String status) { this.status = status; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public void setSectorCode(String sectorCode) { this.sectorCode = sectorCode; }
    public void setMinistryCode(String ministryCode) { this.ministryCode = ministryCode; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }
    public void setPredictions(List<Prediction> predictions) { this.predictions = predictions; }
}
