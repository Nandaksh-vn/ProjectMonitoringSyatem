package com.infrawatch.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "recommendations")
public class Recommendation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(name = "recommendation_type", nullable = false)
    private String recommendationType;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "priority_level")
    private String priorityLevel;

    @Column(name = "action_taken_status")
    private Boolean actionTakenStatus = false;

    @Column(name = "action_taken_details", columnDefinition = "TEXT")
    private String actionTakenDetails;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }
    public String getRecommendationType() { return recommendationType; }
    public void setRecommendationType(String recommendationType) { this.recommendationType = recommendationType; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getPriorityLevel() { return priorityLevel; }
    public void setPriorityLevel(String priorityLevel) { this.priorityLevel = priorityLevel; }
    public Boolean getActionTakenStatus() { return actionTakenStatus; }
    public void setActionTakenStatus(Boolean actionTakenStatus) { this.actionTakenStatus = actionTakenStatus; }
    public String getActionTakenDetails() { return actionTakenDetails; }
    public void setActionTakenDetails(String actionTakenDetails) { this.actionTakenDetails = actionTakenDetails; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
