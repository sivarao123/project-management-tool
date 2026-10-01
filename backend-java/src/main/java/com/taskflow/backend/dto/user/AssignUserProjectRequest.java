package com.taskflow.backend.dto.user;

import jakarta.validation.constraints.NotNull;

public class AssignUserProjectRequest {

    @NotNull(message = "Project ID is required.")
    private Long projectId;

    private String role = "Member";

    public AssignUserProjectRequest() {}

    public AssignUserProjectRequest(Long projectId, String role) {
        this.projectId = projectId;
        this.role = role != null ? role : "Member";
    }

    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}
