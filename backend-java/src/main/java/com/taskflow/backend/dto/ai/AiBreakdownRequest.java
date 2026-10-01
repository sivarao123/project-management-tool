package com.taskflow.backend.dto.ai;

import jakarta.validation.constraints.NotBlank;

public class AiBreakdownRequest {

    @NotBlank(message = "Feature prompt is required.")
    private String prompt;

    private Long projectId;

    public AiBreakdownRequest() {}

    public AiBreakdownRequest(String prompt, Long projectId) {
        this.prompt = prompt;
        this.projectId = projectId;
    }

    public String getPrompt() { return prompt; }
    public void setPrompt(String prompt) { this.prompt = prompt; }
    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }
}
