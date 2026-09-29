package com.infrawatch.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "projects")
public class Project {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_code", unique = true, nullable = false)
    private String projectCode;

    @Column(name = "project_name", nullable = false)
    private String projectName;

    @Column(name = "ministry_id", nullable = false)
    private Long ministryId;

    @Column(name = "sector_id", nullable = false)
    private Long sectorId;

    @Column(name = "agency_id", nullable = false)
    private Long agencyId;

    private String state;
    private String district;

    @Column(name = "approved_cost", nullable = false)
    private BigDecimal approvedCost;

    @Column(name = "revised_cost", nullable = false)
    private BigDecimal revisedCost;

    @Column(name = "current_expenditure", nullable = false)
    private BigDecimal currentExpenditure;

    @Column(name = "approval_date", nullable = false)
    private LocalDate approvalDate;

    @Column(name = "original_start_date", nullable = false)
    private LocalDate originalStartDate;

    @Column(name = "original_completion_date", nullable = false)
    private LocalDate originalCompletionDate;

    @Column(name = "revised_completion_date", nullable = false)
    private LocalDate revisedCompletionDate;

    @Column(name = "physical_progress", nullable = false)
    private BigDecimal physicalProgress;

    @Column(name = "financial_progress", nullable = false)
    private BigDecimal financialProgress;

    @Column(nullable = false)
    private String status;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getProjectCode() { return projectCode; }
    public void setProjectCode(String projectCode) { this.projectCode = projectCode; }
    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }
    public Long getMinistryId() { return ministryId; }
    public void setMinistryId(Long ministryId) { this.ministryId = ministryId; }
    public Long getSectorId() { return sectorId; }
    public void setSectorId(Long sectorId) { this.sectorId = sectorId; }
    public Long getAgencyId() { return agencyId; }
    public void setAgencyId(Long agencyId) { this.agencyId = agencyId; }
    public String getState() { return state; }
    public void setState(String state) { this.state = state; }
    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }
    public BigDecimal getApprovedCost() { return approvedCost; }
    public void setApprovedCost(BigDecimal approvedCost) { this.approvedCost = approvedCost; }
    public BigDecimal getRevisedCost() { return revisedCost; }
    public void setRevisedCost(BigDecimal revisedCost) { this.revisedCost = revisedCost; }
    public BigDecimal getCurrentExpenditure() { return currentExpenditure; }
    public void setCurrentExpenditure(BigDecimal currentExpenditure) { this.currentExpenditure = currentExpenditure; }
    public LocalDate getApprovalDate() { return approvalDate; }
    public void setApprovalDate(LocalDate approvalDate) { this.approvalDate = approvalDate; }
    public LocalDate getOriginalStartDate() { return originalStartDate; }
    public void setOriginalStartDate(LocalDate originalStartDate) { this.originalStartDate = originalStartDate; }
    public LocalDate getOriginalCompletionDate() { return originalCompletionDate; }
    public void setOriginalCompletionDate(LocalDate originalCompletionDate) { this.originalCompletionDate = originalCompletionDate; }
    public LocalDate getRevisedCompletionDate() { return revisedCompletionDate; }
    public void setRevisedCompletionDate(LocalDate revisedCompletionDate) { this.revisedCompletionDate = revisedCompletionDate; }
    public BigDecimal getPhysicalProgress() { return physicalProgress; }
    public void setPhysicalProgress(BigDecimal physicalProgress) { this.physicalProgress = physicalProgress; }
    public BigDecimal getFinancialProgress() { return financialProgress; }
    public void setFinancialProgress(BigDecimal financialProgress) { this.financialProgress = financialProgress; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
