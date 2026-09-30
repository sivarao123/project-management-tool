package com.taskflow.backend.controller;

import com.taskflow.backend.dto.attachment.AttachmentResponse;
import com.taskflow.backend.security.UserPrincipal;
import com.taskflow.backend.service.AttachmentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
public class AttachmentController {

    private final AttachmentService attachmentService;

    public AttachmentController(AttachmentService attachmentService) {
        this.attachmentService = attachmentService;
    }

    @GetMapping("/api/tasks/{taskId}/attachments")
    public ResponseEntity<Map<String, Object>> getTaskAttachments(@PathVariable Long taskId) {
        List<AttachmentResponse> attachments = attachmentService.getTaskAttachments(taskId);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("attachments", attachments);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/api/tasks/{taskId}/attachments")
    public ResponseEntity<Map<String, Object>> uploadTaskAttachment(
            @PathVariable Long taskId,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam("file") MultipartFile file) {
        AttachmentResponse attachment = attachmentService.uploadTaskAttachment(taskId, principal.getId(), file);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Attachment uploaded successfully.");
        response.put("attachment", attachment);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/api/attachments/{id}")
    public ResponseEntity<Map<String, Object>> deleteAttachment(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        attachmentService.deleteAttachment(id, principal.getId(), principal.getRole());
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Attachment deleted.");
        return ResponseEntity.ok(response);
    }
}
