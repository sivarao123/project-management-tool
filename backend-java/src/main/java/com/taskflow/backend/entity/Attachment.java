package com.taskflow.backend.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "attachments")
public class Attachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploader_id")
    private User uploader;

    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @Column(name = "file_url", nullable = false, length = 500)
    private String fileUrl;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "file_type", length = 100)
    private String fileType;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public Attachment() {}

    public Attachment(Long id, Task task, User uploader, String fileName, String fileUrl, Long fileSize, String fileType) {
        this.id = id;
        this.task = task;
        this.uploader = uploader;
        this.fileName = fileName;
        this.fileUrl = fileUrl;
        this.fileSize = fileSize;
        this.fileType = fileType;
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private Task task;
        private User uploader;
        private String fileName;
        private String fileUrl;
        private Long fileSize;
        private String fileType;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder task(Task task) { this.task = task; return this; }
        public Builder uploader(User uploader) { this.uploader = uploader; return this; }
        public Builder fileName(String fileName) { this.fileName = fileName; return this; }
        public Builder fileUrl(String fileUrl) { this.fileUrl = fileUrl; return this; }
        public Builder fileSize(Long fileSize) { this.fileSize = fileSize; return this; }
        public Builder fileType(String fileType) { this.fileType = fileType; return this; }

        public Attachment build() {
            return new Attachment(id, task, uploader, fileName, fileUrl, fileSize, fileType);
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Task getTask() { return task; }
    public void setTask(Task task) { this.task = task; }
    public User getUploader() { return uploader; }
    public void setUploader(User uploader) { this.uploader = uploader; }
    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    public String getFileUrl() { return fileUrl; }
    public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }
    public Long getFileSize() { return fileSize; }
    public void setFileSize(Long fileSize) { this.fileSize = fileSize; }
    public String getFileType() { return fileType; }
    public void setFileType(String fileType) { this.fileType = fileType; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
