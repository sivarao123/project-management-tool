package com.taskflow.backend.service.impl;

import com.taskflow.backend.dto.notification.NotificationResponse;
import com.taskflow.backend.entity.Notification;
import com.taskflow.backend.entity.User;
import com.taskflow.backend.repository.NotificationRepository;
import com.taskflow.backend.repository.UserRepository;
import com.taskflow.backend.service.NotificationService;
import com.taskflow.backend.service.RealtimeMessagingService;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final RealtimeMessagingService realtimeMessagingService;

    public NotificationServiceImpl(NotificationRepository notificationRepository,
                                   UserRepository userRepository,
                                   RealtimeMessagingService realtimeMessagingService) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.realtimeMessagingService = realtimeMessagingService;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getNotifications(Long userId) {
        List<Notification> list = notificationRepository.findByUserIdWithSender(userId, PageRequest.of(0, 50));
        long unreadCount = notificationRepository.countUnreadByUserId(userId);

        List<NotificationResponse> responses = list.stream().map(this::mapToResponse).toList();

        Map<String, Object> result = new HashMap<>();
        result.put("notifications", responses);
        result.put("unreadCount", unreadCount);
        result.put("unread_count", unreadCount);
        return result;
    }

    @Override
    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        notificationRepository.markAsRead(notificationId, userId);
    }

    @Override
    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsRead(userId);
    }

    @Override
    @Transactional
    public void deleteNotification(Long notificationId, Long userId) {
        notificationRepository.deleteByIdAndUserId(notificationId, userId);
    }

    @Override
    @Transactional
    public NotificationResponse createNotification(Long userId, Long senderId, String type, String title, String message, String link) {
        if (userId == null || userId.equals(senderId)) {
            return null;
        }

        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return null;
        }

        User sender = null;
        if (senderId != null) {
            sender = userRepository.findById(senderId).orElse(null);
        }

        Notification notification = Notification.builder()
                .user(user)
                .sender(sender)
                .type(type)
                .title(title)
                .message(message)
                .link(link)
                .isRead(false)
                .build();

        Notification saved = notificationRepository.save(notification);
        NotificationResponse response = mapToResponse(saved);

        realtimeMessagingService.emitToUser(userId, "notification:new", response);
        return response;
    }

    private NotificationResponse mapToResponse(Notification n) {
        NotificationResponse res = new NotificationResponse();
        res.setId(n.getId());
        res.setUserId(n.getUser() != null ? n.getUser().getId() : null);
        res.setType(n.getType());
        res.setTitle(n.getTitle());
        res.setMessage(n.getMessage());
        res.setLink(n.getLink());
        res.setIsRead(n.getIsRead());
        res.setCreatedAt(n.getCreatedAt());

        if (n.getSender() != null) {
            res.setSenderId(n.getSender().getId());
            res.setSenderName(n.getSender().getName());
            res.setSenderAvatar(n.getSender().getAvatarUrl());
        }
        return res;
    }
}
