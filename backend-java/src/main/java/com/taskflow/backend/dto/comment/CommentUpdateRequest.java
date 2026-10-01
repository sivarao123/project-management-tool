package com.taskflow.backend.dto.comment;

import jakarta.validation.constraints.NotBlank;

public class CommentUpdateRequest {

    @NotBlank(message = "Comment content cannot be empty.")
    private String content;

    public CommentUpdateRequest() {}

    public CommentUpdateRequest(String content) {
        this.content = content;
    }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}
