package com.taskflow.backend.dto.ai;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class AiActionItem {
    private String id;
    private String type; // create_task, reassign_task, update_priority
    private String title;
    private String description;
    private String status; // TODO, BACKLOG, IN PROGRESS, IN REVIEW, DONE
    private String priority; // Urgent, High, Medium, Low
    private Long assigneeId;
    private Integer dueInDays;
    private Long taskId;
    private Long newAssigneeId;
    private String newAssigneeName;
    private String reason;

    public AiActionItem() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    public Long getAssigneeId() { return assigneeId; }
    public void setAssigneeId(Long assigneeId) { this.assigneeId = assigneeId; }
    public Integer getDueInDays() { return dueInDays; }
    public void setDueInDays(Integer dueInDays) { this.dueInDays = dueInDays; }
    public Long getTaskId() { return taskId; }
    public void setTaskId(Long taskId) { this.taskId = taskId; }
    public Long getNewAssigneeId() { return newAssigneeId; }
    public void setNewAssigneeId(Long newAssigneeId) { this.newAssigneeId = newAssigneeId; }
    public String getNewAssigneeName() { return newAssigneeName; }
    public void setNewAssigneeName(String newAssigneeName) { this.newAssigneeName = newAssigneeName; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
