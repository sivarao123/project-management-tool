package com.taskflow.backend.dto.ai;

public class AiStepDto {
    private String stage;
    private String title;
    private String detail;

    public AiStepDto() {}

    public AiStepDto(String stage, String title, String detail) {
        this.stage = stage;
        this.title = title;
        this.detail = detail;
    }

    public String getStage() { return stage; }
    public void setStage(String stage) { this.stage = stage; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDetail() { return detail; }
    public void setDetail(String detail) { this.detail = detail; }
}
