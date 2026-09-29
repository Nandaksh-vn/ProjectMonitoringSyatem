package com.infrawatch.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * Implementing agency for a project.
 *
 * <p>The table and its six seed rows existed from the start, but with no entity
 * the {@code projects.agency_id} column could never be resolved to a name and the
 * frontend hard-coded the agency list.
 */
@Entity
@Table(name = "agencies")
public class Agency {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "code", unique = true, nullable = false)
    private String code;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "ministry_id", nullable = false)
    private Long ministryId;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    public Agency() {
    }

    public Agency(String code, String name, Long ministryId) {
        this.code = code;
        this.name = name;
        this.ministryId = ministryId;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Long getMinistryId() { return ministryId; }
    public void setMinistryId(Long ministryId) { this.ministryId = ministryId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
