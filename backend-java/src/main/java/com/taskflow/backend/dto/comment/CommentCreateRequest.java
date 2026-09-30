package com.taskflow.backend.dto.comment;

import jakarta.validation.constraints.NotBlank;

public class CommentCreateRequest {

    @NotBlank(message = "Comment content cannot be empty.")
    private String content;

    private Long parentId;

    public CommentCreateRequest() {}

    public CommentCreateRequest(String content, Long parentId) {
        this.content = content;
        this.parentId = parentId;
    }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public Long getParentId() { return parentId; }
    public void setParentId(Long parentId) { this.parentId = parentId; }
}
