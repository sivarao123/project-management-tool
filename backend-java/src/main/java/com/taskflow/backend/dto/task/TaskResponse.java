package com.taskflow.backend.dto.task;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.taskflow.backend.dto.project.LabelDto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class TaskResponse {
    private Long id;
    private Long projectId;
    private String projectName;
    private String projectColor;
    private String title;
    private String description;
    private String status;
    private String priority;
    private Integer position;
    private Long assigneeId;
    private String assigneeName;
    private String assigneeAvatar;
    private String assigneeEmail;
    private Long creatorId;
    private String creatorName;
    private String creatorAvatar;
    private LocalDate dueDate;
    private long commentsCount;
    private long attachmentsCount;
    private List<LabelDto> labels = new ArrayList<>();
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public TaskResponse() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }
    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }
    public String getProjectColor() { return projectColor; }
    public void setProjectColor(String projectColor) { this.projectColor = projectColor; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    public Integer getPosition() { return position; }
    public void setPosition(Integer position) { this.position = position; }
    public Long getAssigneeId() { return assigneeId; }
    public void setAssigneeId(Long assigneeId) { this.assigneeId = assigneeId; }
    public String getAssigneeName() { return assigneeName; }
    public void setAssigneeName(String assigneeName) { this.assigneeName = assigneeName; }
    public String getAssigneeAvatar() { return assigneeAvatar; }
    public void setAssigneeAvatar(String assigneeAvatar) { this.assigneeAvatar = assigneeAvatar; }
    public String getAssigneeEmail() { return assigneeEmail; }
    public void setAssigneeEmail(String assigneeEmail) { this.assigneeEmail = assigneeEmail; }
    public Long getCreatorId() { return creatorId; }
    public void setCreatorId(Long creatorId) { this.creatorId = creatorId; }
    public String getCreatorName() { return creatorName; }
    public void setCreatorName(String creatorName) { this.creatorName = creatorName; }
    public String getCreatorAvatar() { return creatorAvatar; }
    public void setCreatorAvatar(String creatorAvatar) { this.creatorAvatar = creatorAvatar; }
    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
    public long getCommentsCount() { return commentsCount; }
    public void setCommentsCount(long commentsCount) { this.commentsCount = commentsCount; }
    public long getAttachmentsCount() { return attachmentsCount; }
    public void setAttachmentsCount(long attachmentsCount) { this.attachmentsCount = attachmentsCount; }
    public List<LabelDto> getLabels() { return labels; }
    public void setLabels(List<LabelDto> labels) { this.labels = labels; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
