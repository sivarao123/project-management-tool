package com.taskflow.backend.dto.ai;

public class AiStandupRequest {
    private Long projectId;

    public AiStandupRequest() {}

    public AiStandupRequest(Long projectId) {
        this.projectId = projectId;
    }

    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }
}
