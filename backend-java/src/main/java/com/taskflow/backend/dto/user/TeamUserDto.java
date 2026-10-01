package com.taskflow.backend.dto.user;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class TeamUserDto {
    private Long id;
    private String name;
    private String email;
    private String avatarUrl;
    private String role;
    private String bio;
    private LocalDateTime createdAt;
    private long projectCount;
    private long activeTasksCount;
    private List<UserProjectDto> projects = new ArrayList<>();

    public TeamUserDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public long getProjectCount() { return projectCount; }
    public void setProjectCount(long projectCount) { this.projectCount = projectCount; }
    public long getActiveTasksCount() { return activeTasksCount; }
    public void setActiveTasksCount(long activeTasksCount) { this.activeTasksCount = activeTasksCount; }
    public List<UserProjectDto> getProjects() { return projects; }
    public void setProjects(List<UserProjectDto> projects) { this.projects = projects; }
}
