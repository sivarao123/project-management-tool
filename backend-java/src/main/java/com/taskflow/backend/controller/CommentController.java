package com.taskflow.backend.controller;

import com.taskflow.backend.dto.comment.CommentCreateRequest;
import com.taskflow.backend.dto.comment.CommentResponse;
import com.taskflow.backend.dto.comment.CommentUpdateRequest;
import com.taskflow.backend.security.UserPrincipal;
import com.taskflow.backend.service.CommentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
public class CommentController {

    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @GetMapping("/api/tasks/{taskId}/comments")
    public ResponseEntity<Map<String, Object>> getTaskComments(@PathVariable Long taskId) {
        List<CommentResponse> comments = commentService.getTaskComments(taskId);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("comments", comments);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/api/tasks/{taskId}/comments")
    public ResponseEntity<Map<String, Object>> createComment(
            @PathVariable Long taskId,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CommentCreateRequest request) {
        CommentResponse comment = commentService.createComment(taskId, principal.getId(), request);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Comment added successfully.");
        response.put("comment", comment);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/api/comments/{id}")
    public ResponseEntity<Map<String, Object>> updateComment(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CommentUpdateRequest request) {
        CommentResponse comment = commentService.updateComment(id, principal.getId(), principal.getRole(), request);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Comment updated.");
        response.put("comment", comment);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/api/comments/{id}")
    public ResponseEntity<Map<String, Object>> deleteComment(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        commentService.deleteComment(id, principal.getId(), principal.getRole());
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Comment deleted successfully.");
        return ResponseEntity.ok(response);
    }
}
