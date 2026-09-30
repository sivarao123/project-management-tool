package com.taskflow.backend.dto.search;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class SearchResponse {
    private List<SearchProjectDto> projects = new ArrayList<>();
    private List<SearchTaskDto> tasks = new ArrayList<>();
    private List<SearchMemberDto> members = new ArrayList<>();
    private List<SearchCommentDto> comments = new ArrayList<>();

    public SearchResponse() {}

    public SearchResponse(List<SearchProjectDto> projects, List<SearchTaskDto> tasks,
                          List<SearchMemberDto> members, List<SearchCommentDto> comments) {
        this.projects = projects != null ? projects : new ArrayList<>();
        this.tasks = tasks != null ? tasks : new ArrayList<>();
        this.members = members != null ? members : new ArrayList<>();
        this.comments = comments != null ? comments : new ArrayList<>();
    }

    public List<SearchProjectDto> getProjects() { return projects; }
    public void setProjects(List<SearchProjectDto> projects) { this.projects = projects; }
    public List<SearchTaskDto> getTasks() { return tasks; }
    public void setTasks(List<SearchTaskDto> tasks) { this.tasks = tasks; }
    public List<SearchMemberDto> getMembers() { return members; }
    public void setMembers(List<SearchMemberDto> members) { this.members = members; }
    public List<SearchCommentDto> getComments() { return comments; }
    public void setComments(List<SearchCommentDto> comments) { this.comments = comments; }

    public static class SearchProjectDto {
        private Long id;
        private String name;
        private String description;
        private String color;
        private String priority;
        private String status;

        public SearchProjectDto() {}

        public SearchProjectDto(Long id, String name, String description, String color, String priority, String status) {
            this.id = id;
            this.name = name;
            this.description = description;
            this.color = color;
            this.priority = priority;
            this.status = status;
        }

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
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }

    public static class SearchTaskDto {
        private Long id;
        private String title;
        private String description;
        private String status;
        private String priority;
        private LocalDate dueDate;
        private Long projectId;
        private String projectName;
        private String projectColor;
        private String assigneeName;
        private String assigneeAvatar;

        public SearchTaskDto() {}

        public SearchTaskDto(Long id, String title, String description, String status, String priority,
                             LocalDate dueDate, Long projectId, String projectName, String projectColor,
                             String assigneeName, String assigneeAvatar) {
            this.id = id;
            this.title = title;
            this.description = description;
            this.status = status;
            this.priority = priority;
            this.dueDate = dueDate;
            this.projectId = projectId;
            this.projectName = projectName;
            this.projectColor = projectColor;
            this.assigneeName = assigneeName;
            this.assigneeAvatar = assigneeAvatar;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
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
        public Long getProjectId() { return projectId; }
        public void setProjectId(Long projectId) { this.projectId = projectId; }
        public String getProjectName() { return projectName; }
        public void setProjectName(String projectName) { this.projectName = projectName; }
        public String getProjectColor() { return projectColor; }
        public void setProjectColor(String projectColor) { this.projectColor = projectColor; }
        public String getAssigneeName() { return assigneeName; }
        public void setAssigneeName(String assigneeName) { this.assigneeName = assigneeName; }
        public String getAssigneeAvatar() { return assigneeAvatar; }
        public void setAssigneeAvatar(String assigneeAvatar) { this.assigneeAvatar = assigneeAvatar; }
    }

    public static class SearchMemberDto {
        private Long id;
        private String name;
        private String email;
        private String avatarUrl;
        private String role;
        private String bio;

        public SearchMemberDto() {}

        public SearchMemberDto(Long id, String name, String email, String avatarUrl, String role, String bio) {
            this.id = id;
            this.name = name;
            this.email = email;
            this.avatarUrl = avatarUrl;
            this.role = role;
            this.bio = bio;
        }

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
    }

    public static class SearchCommentDto {
        private Long id;
        private String content;
        private Long taskId;
        private LocalDateTime createdAt;
        private String taskTitle;
        private Long projectId;
        private String authorName;
        private String authorAvatar;

        public SearchCommentDto() {}

        public SearchCommentDto(Long id, String content, Long taskId, LocalDateTime createdAt,
                                String taskTitle, Long projectId, String authorName, String authorAvatar) {
            this.id = id;
            this.content = content;
            this.taskId = taskId;
            this.createdAt = createdAt;
            this.taskTitle = taskTitle;
            this.projectId = projectId;
            this.authorName = authorName;
            this.authorAvatar = authorAvatar;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
        public Long getTaskId() { return taskId; }
        public void setTaskId(Long taskId) { this.taskId = taskId; }
        public LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
        public String getTaskTitle() { return taskTitle; }
        public void setTaskTitle(String taskTitle) { this.taskTitle = taskTitle; }
        public Long getProjectId() { return projectId; }
        public void setProjectId(Long projectId) { this.projectId = projectId; }
        public String getAuthorName() { return authorName; }
        public void setAuthorName(String authorName) { this.authorName = authorName; }
        public String getAuthorAvatar() { return authorAvatar; }
        public void setAuthorAvatar(String authorAvatar) { this.authorAvatar = authorAvatar; }
    }
}
