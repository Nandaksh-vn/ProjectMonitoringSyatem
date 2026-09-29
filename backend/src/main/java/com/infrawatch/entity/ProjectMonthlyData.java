package com.infrawatch.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "project_monthly_data")
public class ProjectMonthlyData {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(name = "reporting_month", nullable = false)
    private LocalDate reportingMonth;

    @Column(name = "planned_physical_progress", nullable = false)
    private BigDecimal plannedPhysicalProgress;

    @Column(name = "actual_physical_progress", nullable = false)
    private BigDecimal actualPhysicalProgress;

    @Column(name = "planned_financial_progress", nullable = false)
    private BigDecimal plannedFinancialProgress;

    @Column(name = "actual_financial_progress", nullable = false)
    private BigDecimal actualFinancialProgress;

    @Column(name = "monthly_expenditure", nullable = false)
    private BigDecimal monthlyExpenditure;

    @Column(name = "cumulative_expenditure", nullable = false)
    private BigDecimal cumulativeExpenditure;

    @Column(name = "milestones_planned", nullable = false)
    private Integer milestonesPlanned;

    @Column(name = "milestones_completed", nullable = false)
    private Integer milestonesCompleted;

    @Column(name = "milestones_delayed", nullable = false)
    private Integer milestonesDelayed;

    @Column(name = "revised_cost", nullable = false)
    private BigDecimal revisedCost;

    @Column(name = "revised_completion_date", nullable = false)
    private LocalDate revisedCompletionDate;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }
    public LocalDate getReportingMonth() { return reportingMonth; }
    public void setReportingMonth(LocalDate reportingMonth) { this.reportingMonth = reportingMonth; }
    public BigDecimal getPlannedPhysicalProgress() { return plannedPhysicalProgress; }
    public void setPlannedPhysicalProgress(BigDecimal plannedPhysicalProgress) { this.plannedPhysicalProgress = plannedPhysicalProgress; }
    public BigDecimal getActualPhysicalProgress() { return actualPhysicalProgress; }
    public void setActualPhysicalProgress(BigDecimal actualPhysicalProgress) { this.actualPhysicalProgress = actualPhysicalProgress; }
    public BigDecimal getPlannedFinancialProgress() { return plannedFinancialProgress; }
    public void setPlannedFinancialProgress(BigDecimal plannedFinancialProgress) { this.plannedFinancialProgress = plannedFinancialProgress; }
    public BigDecimal getActualFinancialProgress() { return actualFinancialProgress; }
    public void setActualFinancialProgress(BigDecimal actualFinancialProgress) { this.actualFinancialProgress = actualFinancialProgress; }
    public BigDecimal getMonthlyExpenditure() { return monthlyExpenditure; }
    public void setMonthlyExpenditure(BigDecimal monthlyExpenditure) { this.monthlyExpenditure = monthlyExpenditure; }
    public BigDecimal getCumulativeExpenditure() { return cumulativeExpenditure; }
    public void setCumulativeExpenditure(BigDecimal cumulativeExpenditure) { this.cumulativeExpenditure = cumulativeExpenditure; }
    public Integer getMilestonesPlanned() { return milestonesPlanned; }
    public void setMilestonesPlanned(Integer milestonesPlanned) { this.milestonesPlanned = milestonesPlanned; }
    public Integer getMilestonesCompleted() { return milestonesCompleted; }
    public void setMilestonesCompleted(Integer milestonesCompleted) { this.milestonesCompleted = milestonesCompleted; }
    public Integer getMilestonesDelayed() { return milestonesDelayed; }
    public void setMilestonesDelayed(Integer milestonesDelayed) { this.milestonesDelayed = milestonesDelayed; }
    public BigDecimal getRevisedCost() { return revisedCost; }
    public void setRevisedCost(BigDecimal revisedCost) { this.revisedCost = revisedCost; }
    public LocalDate getRevisedCompletionDate() { return revisedCompletionDate; }
    public void setRevisedCompletionDate(LocalDate revisedCompletionDate) { this.revisedCompletionDate = revisedCompletionDate; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
