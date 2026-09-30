package com.taskflow.backend.service;

import com.taskflow.backend.dto.notification.NotificationResponse;
import com.taskflow.backend.entity.Notification;
import com.taskflow.backend.entity.User;
import com.taskflow.backend.repository.NotificationRepository;
import com.taskflow.backend.repository.UserRepository;
import com.taskflow.backend.service.impl.NotificationServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import java.util.Collections;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RealtimeMessagingService realtimeMessagingService;

    @InjectMocks
    private NotificationServiceImpl notificationService;

    private User recipient;
    private User sender;

    @BeforeEach
    void setUp() {
        recipient = User.builder().id(1L).name("Recipient").email("rec@taskflow.dev").build();
        sender = User.builder().id(2L).name("Sender").email("sender@taskflow.dev").build();
    }

    @Test
    @DisplayName("createNotification() does not create notification when recipient is sender")
    void testCreateNotificationSelfIgnored() {
        NotificationResponse res = notificationService.createNotification(1L, 1L, "task", "Title", "Message", "/link");
        assertNull(res);
        verifyNoInteractions(notificationRepository);
    }

    @Test
    @DisplayName("createNotification() saves notification and emits real-time event")
    void testCreateNotificationSuccess() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(recipient));
        when(userRepository.findById(2L)).thenReturn(Optional.of(sender));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> {
            Notification n = invocation.getArgument(0);
            n.setId(99L);
            return n;
        });

        NotificationResponse res = notificationService.createNotification(1L, 2L, "task_assigned", "Task Assigned", "You were assigned", "/tasks/1");

        assertNotNull(res);
        assertEquals(99L, res.getId());
        assertEquals(1L, res.getUserId());
        assertEquals("Task Assigned", res.getTitle());
        verify(realtimeMessagingService).emitToUser(eq(1L), eq("notification:new"), any());
    }

    @Test
    @DisplayName("getNotifications() returns list and unread counts")
    void testGetNotifications() {
        when(notificationRepository.findByUserIdWithSender(eq(1L), any(Pageable.class))).thenReturn(Collections.emptyList());
        when(notificationRepository.countUnreadByUserId(1L)).thenReturn(5L);

        Map<String, Object> result = notificationService.getNotifications(1L);

        assertNotNull(result);
        assertEquals(5L, result.get("unreadCount"));
        assertEquals(5L, result.get("unread_count"));
        assertTrue(result.containsKey("notifications"));
    }

    @Test
    @DisplayName("markAsRead() updates read status")
    void testMarkAsRead() {
        notificationService.markAsRead(10L, 1L);
        verify(notificationRepository).markAsRead(10L, 1L);
    }

    @Test
    @DisplayName("markAllAsRead() marks all as read")
    void testMarkAllAsRead() {
        notificationService.markAllAsRead(1L);
        verify(notificationRepository).markAllAsRead(1L);
    }

    @Test
    @DisplayName("deleteNotification() deletes by ID and user ID")
    void testDeleteNotification() {
        notificationService.deleteNotification(10L, 1L);
        verify(notificationRepository).deleteByIdAndUserId(10L, 1L);
    }
}
