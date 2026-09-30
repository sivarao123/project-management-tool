package com.taskflow.backend.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "tasks")
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 30)
    private String status = "TODO";

    @Column(length = 20)
    private String priority = "Medium";

    @Column(nullable = false)
    private Integer position = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignee_id")
    private User assignee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creator_id")
    private User creator;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "task_labels",
            joinColumns = @JoinColumn(name = "task_id"),
            inverseJoinColumns = @JoinColumn(name = "label_id")
    )
    private Set<Label> labels = new HashSet<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Task() {}

    public Task(Long id, Project project, String title, String description, String status,
                String priority, Integer position, User assignee, User creator, LocalDate dueDate) {
        this.id = id;
        this.project = project;
        this.title = title;
        this.description = description;
        this.status = status != null ? status : "TODO";
        this.priority = priority != null ? priority : "Medium";
        this.position = position != null ? position : 0;
        this.assignee = assignee;
        this.creator = creator;
        this.dueDate = dueDate;
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private Project project;
        private String title;
        private String description;
        private String status = "TODO";
        private String priority = "Medium";
        private Integer position = 0;
        private User assignee;
        private User creator;
        private LocalDate dueDate;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder project(Project project) { this.project = project; return this; }
        public Builder title(String title) { this.title = title; return this; }
        public Builder description(String description) { this.description = description; return this; }
        public Builder status(String status) { this.status = status; return this; }
        public Builder priority(String priority) { this.priority = priority; return this; }
        public Builder position(Integer position) { this.position = position; return this; }
        public Builder assignee(User assignee) { this.assignee = assignee; return this; }
        public Builder creator(User creator) { this.creator = creator; return this; }
        public Builder dueDate(LocalDate dueDate) { this.dueDate = dueDate; return this; }

        public Task build() {
            return new Task(id, project, title, description, status, priority, position, assignee, creator, dueDate);
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }
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
    public User getAssignee() { return assignee; }
    public void setAssignee(User assignee) { this.assignee = assignee; }
    public User getCreator() { return creator; }
    public void setCreator(User creator) { this.creator = creator; }
    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
    public Set<Label> getLabels() { return labels; }
    public void setLabels(Set<Label> labels) { this.labels = labels; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
