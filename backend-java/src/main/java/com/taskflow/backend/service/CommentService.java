package com.taskflow.backend.service;

import com.taskflow.backend.dto.comment.CommentCreateRequest;
import com.taskflow.backend.dto.comment.CommentResponse;
import com.taskflow.backend.dto.comment.CommentUpdateRequest;

import java.util.List;

public interface CommentService {
    List<CommentResponse> getTaskComments(Long taskId);
    CommentResponse createComment(Long taskId, Long userId, CommentCreateRequest request);
    CommentResponse updateComment(Long commentId, Long userId, String userRole, CommentUpdateRequest request);
    void deleteComment(Long commentId, Long userId, String userRole);
}
