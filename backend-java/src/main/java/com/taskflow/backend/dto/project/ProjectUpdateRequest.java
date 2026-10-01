package com.taskflow.backend.dto.project;

import java.time.LocalDate;

public class ProjectUpdateRequest {
    private String name;
    private String description;
    private String color;
    private String priority;
    private LocalDate startDate;
    private LocalDate dueDate;
    private String status;

    public ProjectUpdateRequest() {}

    public ProjectUpdateRequest(String name, String description, String color, String priority,
                                LocalDate startDate, LocalDate dueDate, String status) {
        this.name = name;
        this.description = description;
        this.color = color;
        this.priority = priority;
        this.startDate = startDate;
        this.dueDate = dueDate;
        this.status = status;
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
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
