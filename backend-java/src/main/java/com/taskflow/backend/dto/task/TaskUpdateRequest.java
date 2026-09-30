package com.taskflow.backend.dto.task;

import java.time.LocalDate;
import java.util.List;

public class TaskUpdateRequest {
    private String title;
    private String description;
    private String status;
    private String priority;
    private LocalDate dueDate;
    private Long assigneeId;
    private Integer position;
    private List<Long> labelIds;

    public TaskUpdateRequest() {}

    public TaskUpdateRequest(String title, String description, String status, String priority,
                             LocalDate dueDate, Long assigneeId, Integer position, List<Long> labelIds) {
        this.title = title;
        this.description = description;
        this.status = status;
        this.priority = priority;
        this.dueDate = dueDate;
        this.assigneeId = assigneeId;
        this.position = position;
        this.labelIds = labelIds;
    }

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
    public Integer getPosition() { return position; }
    public void setPosition(Integer position) { this.position = position; }
    public List<Long> getLabelIds() { return labelIds; }
    public void setLabelIds(List<Long> labelIds) { this.labelIds = labelIds; }
}
