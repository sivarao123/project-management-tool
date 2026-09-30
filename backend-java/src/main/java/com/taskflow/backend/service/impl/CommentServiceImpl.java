package com.taskflow.backend.service.impl;

import com.taskflow.backend.dto.comment.CommentCreateRequest;
import com.taskflow.backend.dto.comment.CommentResponse;
import com.taskflow.backend.dto.comment.CommentUpdateRequest;
import com.taskflow.backend.entity.Comment;
import com.taskflow.backend.entity.Task;
import com.taskflow.backend.entity.User;
import com.taskflow.backend.exception.BadRequestException;
import com.taskflow.backend.exception.ResourceNotFoundException;
import com.taskflow.backend.exception.UnauthorizedException;
import com.taskflow.backend.repository.CommentRepository;
import com.taskflow.backend.repository.TaskRepository;
import com.taskflow.backend.repository.UserRepository;
import com.taskflow.backend.service.ActivityService;
import com.taskflow.backend.service.CommentService;
import com.taskflow.backend.service.NotificationService;
import com.taskflow.backend.service.RealtimeMessagingService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class CommentServiceImpl implements CommentService {

    private final CommentRepository commentRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final ActivityService activityService;
    private final NotificationService notificationService;
    private final RealtimeMessagingService realtimeMessagingService;

    public CommentServiceImpl(CommentRepository commentRepository,
                              TaskRepository taskRepository,
                              UserRepository userRepository,
                              ActivityService activityService,
                              NotificationService notificationService,
                              RealtimeMessagingService realtimeMessagingService) {
        this.commentRepository = commentRepository;
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.activityService = activityService;
        this.notificationService = notificationService;
        this.realtimeMessagingService = realtimeMessagingService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<CommentResponse> getTaskComments(Long taskId) {
        List<Comment> comments = commentRepository.findByTaskIdWithUser(taskId);
        return comments.stream().map(this::mapToResponse).toList();
    }

    @Override
    @Transactional
    public CommentResponse createComment(Long taskId, Long userId, CommentCreateRequest request) {
        if (request.getContent() == null || request.getContent().trim().isEmpty()) {
            throw new BadRequestException("Comment content cannot be empty.");
        }

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found."));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        Comment comment = Comment.builder()
                .task(task)
                .user(user)
                .parentId(request.getParentId())
                .content(request.getContent().trim())
                .build();

        Comment saved = commentRepository.save(comment);
        CommentResponse response = mapToResponse(saved);

        // Log Activity
        Map<String, Object> meta = new HashMap<>();
        meta.put("taskTitle", task.getTitle());
        meta.put("commentId", saved.getId());
        activityService.logActivity(task.getProject().getId(), userId, "added_comment", "comment", taskId, meta);

        // Notify task assignee if not the commenter
        if (task.getAssignee() != null && !task.getAssignee().getId().equals(userId)) {
            notificationService.createNotification(
                    task.getAssignee().getId(),
                    userId,
                    "comment",
                    "New Comment",
                    user.getName() + " commented on \"" + task.getTitle() + "\"",
                    "/projects/" + task.getProject().getId() + "?task=" + taskId
            );
        }

        // Notify task creator if different from commenter and assignee
        if (task.getCreator() != null && !task.getCreator().getId().equals(userId)) {
            boolean isAssignee = task.getAssignee() != null && task.getCreator().getId().equals(task.getAssignee().getId());
            if (!isAssignee) {
                notificationService.createNotification(
                        task.getCreator().getId(),
                        userId,
                        "comment",
                        "New Comment",
                        user.getName() + " commented on \"" + task.getTitle() + "\"",
                        "/projects/" + task.getProject().getId() + "?task=" + taskId
                );
            }
        }

        // Real-time broadcast to project
        Map<String, Object> broadcastData = new HashMap<>();
        broadcastData.put("taskId", taskId);
        broadcastData.put("comment", response);
        realtimeMessagingService.emitToProject(task.getProject().getId(), "comment:created", broadcastData);

        return response;
    }

    @Override
    @Transactional
    public CommentResponse updateComment(Long commentId, Long userId, String userRole, CommentUpdateRequest request) {
        if (request.getContent() == null || request.getContent().trim().isEmpty()) {
            throw new BadRequestException("Comment content cannot be empty.");
        }

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found."));

        boolean isAuthor = comment.getUser().getId().equals(userId);
        boolean isAdmin = "Admin".equalsIgnoreCase(userRole);
        if (!isAuthor && !isAdmin) {
            throw new UnauthorizedException("You can only edit your own comments.");
        }

        comment.setContent(request.getContent().trim());
        Comment updated = commentRepository.save(comment);
        CommentResponse response = mapToResponse(updated);

        Map<String, Object> broadcastData = new HashMap<>();
        broadcastData.put("taskId", comment.getTask().getId());
        broadcastData.put("comment", response);
        realtimeMessagingService.emitToProject(comment.getTask().getProject().getId(), "comment:updated", broadcastData);

        return response;
    }

    @Override
    @Transactional
    public void deleteComment(Long commentId, Long userId, String userRole) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found."));

        boolean isAuthor = comment.getUser().getId().equals(userId);
        boolean isAdmin = "Admin".equalsIgnoreCase(userRole);
        if (!isAuthor && !isAdmin) {
            throw new UnauthorizedException("You can only delete your own comments.");
        }

        Long taskId = comment.getTask().getId();
        Long projectId = comment.getTask().getProject().getId();

        commentRepository.delete(comment);

        Map<String, Object> broadcastData = new HashMap<>();
        broadcastData.put("taskId", taskId);
        broadcastData.put("commentId", commentId);
        realtimeMessagingService.emitToProject(projectId, "comment:deleted", broadcastData);
    }

    private CommentResponse mapToResponse(Comment c) {
        CommentResponse res = new CommentResponse();
        res.setId(c.getId());
        if (c.getTask() != null) {
            res.setTaskId(c.getTask().getId());
        }
        if (c.getUser() != null) {
            res.setUserId(c.getUser().getId());
            res.setAuthorName(c.getUser().getName());
            res.setAuthorAvatar(c.getUser().getAvatarUrl());
            res.setAuthorEmail(c.getUser().getEmail());
        }
        res.setParentId(c.getParentId());
        res.setContent(c.getContent());
        res.setCreatedAt(c.getCreatedAt());
        res.setUpdatedAt(c.getUpdatedAt());
        return res;
    }
}
