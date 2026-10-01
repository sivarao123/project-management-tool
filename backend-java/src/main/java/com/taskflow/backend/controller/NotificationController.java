package com.taskflow.backend.controller;

import com.taskflow.backend.security.UserPrincipal;
import com.taskflow.backend.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getNotifications(@AuthenticationPrincipal UserPrincipal principal) {
        Map<String, Object> data = notificationService.getNotifications(principal.getId());
        Map<String, Object> response = new HashMap<>(data);
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/read-all")
    public ResponseEntity<Map<String, Object>> markAllAsRead(@AuthenticationPrincipal UserPrincipal principal) {
        notificationService.markAllAsRead(principal.getId());
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "All notifications marked as read.");
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Map<String, Object>> markAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        notificationService.markAsRead(id, principal.getId());
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Notification marked as read.");
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteNotification(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        notificationService.deleteNotification(id, principal.getId());
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Notification deleted.");
        return ResponseEntity.ok(response);
    }
}
