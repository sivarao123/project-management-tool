package com.taskflow.backend.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "projects")
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 20)
    private String color = "#4F46E5";

    @Column(length = 20)
    private String priority = "Medium";

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(length = 30)
    private String status = "Active";

    @Column(name = "is_archived")
    private Boolean isArchived = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Project() {}

    public Project(Long id, String name, String description, String color, String priority,
                   LocalDate startDate, LocalDate dueDate, String status, Boolean isArchived, User owner) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.color = color != null ? color : "#4F46E5";
        this.priority = priority != null ? priority : "Medium";
        this.startDate = startDate;
        this.dueDate = dueDate;
        this.status = status != null ? status : "Active";
        this.isArchived = isArchived != null ? isArchived : false;
        this.owner = owner;
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private String name;
        private String description;
        private String color = "#4F46E5";
        private String priority = "Medium";
        private LocalDate startDate;
        private LocalDate dueDate;
        private String status = "Active";
        private Boolean isArchived = false;
        private User owner;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder name(String name) { this.name = name; return this; }
        public Builder description(String description) { this.description = description; return this; }
        public Builder color(String color) { this.color = color; return this; }
        public Builder priority(String priority) { this.priority = priority; return this; }
        public Builder startDate(LocalDate startDate) { this.startDate = startDate; return this; }
        public Builder dueDate(LocalDate dueDate) { this.dueDate = dueDate; return this; }
        public Builder status(String status) { this.status = status; return this; }
        public Builder isArchived(Boolean isArchived) { this.isArchived = isArchived; return this; }
        public Builder owner(User owner) { this.owner = owner; return this; }

        public Project build() {
            return new Project(id, name, description, color, priority, startDate, dueDate, status, isArchived, owner);
        }
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
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Boolean getIsArchived() { return isArchived; }
    public void setIsArchived(Boolean isArchived) { this.isArchived = isArchived; }
    public User getOwner() { return owner; }
    public void setOwner(User owner) { this.owner = owner; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
