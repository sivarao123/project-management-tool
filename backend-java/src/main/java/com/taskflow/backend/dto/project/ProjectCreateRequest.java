package com.taskflow.backend.dto.project;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;
import java.util.List;

public class ProjectCreateRequest {
    @NotBlank(message = "Project name is required.")
    private String name;

    private String description;
    private String color;
    private String priority;
    private LocalDate startDate;
    private LocalDate dueDate;
    private List<InitialMember> members;

    public static class InitialMember {
        private Long userId;
        private String role;

        public InitialMember() {}
        public InitialMember(Long userId, String role) {
            this.userId = userId;
            this.role = role;
        }

        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
    }

    public ProjectCreateRequest() {}

    public ProjectCreateRequest(String name, String description, String color, String priority,
                                LocalDate startDate, LocalDate dueDate, List<InitialMember> members) {
        this.name = name;
        this.description = description;
        this.color = color;
        this.priority = priority;
        this.startDate = startDate;
        this.dueDate = dueDate;
        this.members = members;
    }

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
    public List<InitialMember> getMembers() { return members; }
    public void setMembers(List<InitialMember> members) { this.members = members; }
}
