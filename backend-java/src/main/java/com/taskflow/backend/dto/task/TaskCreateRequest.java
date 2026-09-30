package com.taskflow.backend.dto.task;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;
import java.util.List;

public class TaskCreateRequest {
    private Long projectId;

    @NotBlank(message = "Task title is required.")
    private String title;

    private String description;
    private String status;
    private String priority;
    private LocalDate dueDate;
    private Long assigneeId;
    private List<Long> labelIds;

    public TaskCreateRequest() {}

    public TaskCreateRequest(Long projectId, String title, String description, String status,
                             String priority, LocalDate dueDate, Long assigneeId, List<Long> labelIds) {
        this.projectId = projectId;
        this.title = title;
        this.description = description;
        this.status = status;
        this.priority = priority;
        this.dueDate = dueDate;
        this.assigneeId = assigneeId;
        this.labelIds = labelIds;
    }

    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
    public Long getAssigneeId() { return assigneeId; }
    public void setAssigneeId(Long assigneeId) { this.assigneeId = assigneeId; }
    public List<Long> getLabelIds() { return labelIds; }
    public void setLabelIds(List<Long> labelIds) { this.labelIds = labelIds; }
}
