package com.taskflow.backend.dto.ai;

public class AiEnhanceTaskRequest {
    private String title;
    private String description;

    public AiEnhanceTaskRequest() {}

    public AiEnhanceTaskRequest(String title, String description) {
        this.title = title;
        this.description = description;
    }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
