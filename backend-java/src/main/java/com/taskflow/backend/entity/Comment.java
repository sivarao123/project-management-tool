package com.taskflow.backend.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "comments")
public class Comment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "parent_id")
    private Long parentId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Comment() {}

    public Comment(Long id, Task task, User user, Long parentId, String content) {
        this.id = id;
        this.task = task;
        this.user = user;
        this.parentId = parentId;
        this.content = content;
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private Task task;
        private User user;
        private Long parentId;
        private String content;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder task(Task task) { this.task = task; return this; }
        public Builder user(User user) { this.user = user; return this; }
        public Builder parentId(Long parentId) { this.parentId = parentId; return this; }
        public Builder content(String content) { this.content = content; return this; }

        public Comment build() {
            return new Comment(id, task, user, parentId, content);
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Task getTask() { return task; }
    public void setTask(Task task) { this.task = task; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public Long getParentId() { return parentId; }
    public void setParentId(Long parentId) { this.parentId = parentId; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
