package com.taskflow.backend.dto.ai;

import jakarta.validation.constraints.NotBlank;

public class AiAgentRequest {

    @NotBlank(message = "Prompt cannot be empty.")
    private String prompt;

    private Long projectId;

    public AiAgentRequest() {}

    public AiAgentRequest(String prompt, Long projectId) {
        this.prompt = prompt;
        this.projectId = projectId;
    }

    public String getPrompt() { return prompt; }
    public void setPrompt(String prompt) { this.prompt = prompt; }
    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }
}
