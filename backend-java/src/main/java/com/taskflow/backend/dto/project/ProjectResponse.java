package com.taskflow.backend.dto.project;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.taskflow.backend.dto.member.MemberResponse;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class ProjectResponse {
    private Long id;
    private String name;
    private String description;
    private String color;
    private String priority;
    private LocalDate startDate;
    private LocalDate dueDate;
    private String status;
    @JsonProperty("is_archived")
    private Boolean isArchived;
    private Long ownerId;
    private String ownerName;
    private String ownerAvatar;
    private String userRole;
    private Long totalTasks;
    private Long completedTasks;
    private Long memberCount;
    private Integer progress;
    private List<MemberResponse> members;
    private List<LabelDto> labels;
    private ProjectStatsDto stats;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public ProjectResponse() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Boolean getIsArchived() { return isArchived; }
    public void setIsArchived(Boolean isArchived) { this.isArchived = isArchived; }
    public Long getOwnerId() { return ownerId; }
    public void setOwnerId(Long ownerId) { this.ownerId = ownerId; }
    public String getOwnerName() { return ownerName; }
    public void setOwnerName(String ownerName) { this.ownerName = ownerName; }
    public String getOwnerAvatar() { return ownerAvatar; }
    public void setOwnerAvatar(String ownerAvatar) { this.ownerAvatar = ownerAvatar; }
    public String getUserRole() { return userRole; }
    public void setUserRole(String userRole) { this.userRole = userRole; }
    public Long getTotalTasks() { return totalTasks; }
    public void setTotalTasks(Long totalTasks) { this.totalTasks = totalTasks; }
    public Long getCompletedTasks() { return completedTasks; }
    public void setCompletedTasks(Long completedTasks) { this.completedTasks = completedTasks; }
    public Long getMemberCount() { return memberCount; }
    public void setMemberCount(Long memberCount) { this.memberCount = memberCount; }
    public Integer getProgress() { return progress; }
    public void setProgress(Integer progress) { this.progress = progress; }
    public List<MemberResponse> getMembers() { return members; }
    public void setMembers(List<MemberResponse> members) { this.members = members; }
    public List<LabelDto> getLabels() { return labels; }
    public void setLabels(List<LabelDto> labels) { this.labels = labels; }
    public ProjectStatsDto getStats() { return stats; }
    public void setStats(ProjectStatsDto stats) { this.stats = stats; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
