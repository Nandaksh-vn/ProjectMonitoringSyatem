package com.infrawatch.dto;

public class ChatRequest {
    private String message;
    private Long projectId;

    public ChatRequest() {}

    public ChatRequest(String message, Long projectId) {
        this.message = message;
        this.projectId = projectId;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Long getProjectId() {
        return projectId;
    }

    public void setProjectId(Long projectId) {
        this.projectId = projectId;
    }
}
