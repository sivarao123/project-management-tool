package com.taskflow.backend.service;

import com.taskflow.backend.dto.notification.NotificationResponse;

import java.util.Map;

public interface NotificationService {
    Map<String, Object> getNotifications(Long userId);
    void markAsRead(Long notificationId, Long userId);
    void markAllAsRead(Long userId);
    void deleteNotification(Long notificationId, Long userId);
    NotificationResponse createNotification(Long userId, Long senderId, String type, String title, String message, String link);
}
