package com.taskflow.backend.service.impl;

import com.taskflow.backend.dto.project.LabelDto;
import com.taskflow.backend.dto.task.TaskCreateRequest;
import com.taskflow.backend.dto.task.TaskReorderRequest;
import com.taskflow.backend.dto.task.TaskResponse;
import com.taskflow.backend.dto.task.TaskUpdateRequest;
import com.taskflow.backend.entity.Label;
import com.taskflow.backend.entity.Project;
import com.taskflow.backend.entity.Task;
import com.taskflow.backend.entity.User;
import com.taskflow.backend.exception.ResourceNotFoundException;
import com.taskflow.backend.repository.*;
import com.taskflow.backend.service.ActivityService;
import com.taskflow.backend.service.NotificationService;
import com.taskflow.backend.service.RealtimeMessagingService;
import com.taskflow.backend.service.TaskService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;

@Service
public class TaskServiceImpl implements TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final LabelRepository labelRepository;
    private final CommentRepository commentRepository;
    private final AttachmentRepository attachmentRepository;
    private final ActivityService activityService;
    private final NotificationService notificationService;
    private final RealtimeMessagingService realtimeMessagingService;

    public TaskServiceImpl(TaskRepository taskRepository,
                           ProjectRepository projectRepository,
                           UserRepository userRepository,
                           LabelRepository labelRepository,
                           CommentRepository commentRepository,
                           AttachmentRepository attachmentRepository,
                           ActivityService activityService,
                           NotificationService notificationService,
                           RealtimeMessagingService realtimeMessagingService) {
        this.taskRepository = taskRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.labelRepository = labelRepository;
        this.commentRepository = commentRepository;
        this.attachmentRepository = attachmentRepository;
        this.activityService = activityService;
        this.notificationService = notificationService;
        this.realtimeMessagingService = realtimeMessagingService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskResponse> getProjectTasks(Long projectId) {
        List<Task> tasks = taskRepository.findByProjectIdWithRelations(projectId);
        return tasks.stream().map(this::mapToTaskResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public TaskResponse getTaskById(Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found."));
        return mapToTaskResponse(task);
    }

    @Override
    @Transactional
    public TaskResponse createTask(Long projectId, Long creatorId, TaskCreateRequest request) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found."));

        User creator = userRepository.findById(creatorId).orElse(null);

        User assignee = null;
        if (request.getAssigneeId() != null) {
            assignee = userRepository.findById(request.getAssigneeId()).orElse(null);
        }

        String status = request.getStatus() != null ? request.getStatus() : "TODO";
        String priority = request.getPriority() != null ? request.getPriority() : "Medium";
        Integer position = taskRepository.getNextPosition(projectId, status);

        Task task = Task.builder()
                .project(project)
                .title(request.getTitle().trim())
                .description(request.getDescription() != null ? request.getDescription() : "")
                .status(status)
                .priority(priority)
                .position(position)
                .assignee(assignee)
                .creator(creator)
                .dueDate(request.getDueDate())
                .build();

        if (request.getLabelIds() != null && !request.getLabelIds().isEmpty()) {
            List<Label> labels = labelRepository.findAllById(request.getLabelIds());
            task.setLabels(new HashSet<>(labels));
        }

        Task saved = taskRepository.save(task);
        TaskResponse response = mapToTaskResponse(saved);

        // Log activity
        Map<String, Object> meta = new HashMap<>();
        meta.put("title", saved.getTitle());
        meta.put("status", status);
        activityService.logActivity(projectId, creatorId, "created_task", "task", saved.getId(), meta);

        // Notify assignee if assigned to someone else
        if (assignee != null && !assignee.getId().equals(creatorId)) {
            String creatorName = creator != null ? creator.getName() : "A team member";
            notificationService.createNotification(
                    assignee.getId(),
                    creatorId,
                    "task_assigned",
                    "Task Assigned",
                    creatorName + " assigned you to \"" + saved.getTitle() + "\"",
                    "/projects/" + projectId + "?task=" + saved.getId()
            );
        }

        // Real-time broadcast
        realtimeMessagingService.emitToProject(projectId, "task:created", response);

        return response;
    }

    @Override
    @Transactional
    public TaskResponse updateTask(Long taskId, Long userId, TaskUpdateRequest request) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found."));

        Long oldAssigneeId = task.getAssignee() != null ? task.getAssignee().getId() : null;

        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            task.setTitle(request.getTitle().trim());
        }
        if (request.getDescription() != null) {
            task.setDescription(request.getDescription());
        }
        if (request.getStatus() != null) {
            task.setStatus(request.getStatus());
        }
        if (request.getPriority() != null) {
            task.setPriority(request.getPriority());
        }
        if (request.getPosition() != null) {
            task.setPosition(request.getPosition());
        }
        if (request.getDueDate() != null) {
            task.setDueDate(request.getDueDate());
        }
        if (request.getAssigneeId() != null) {
            User assignee = userRepository.findById(request.getAssigneeId()).orElse(null);
            task.setAssignee(assignee);
        }

        if (request.getLabelIds() != null) {
            List<Label> labels = labelRepository.findAllById(request.getLabelIds());
            task.setLabels(new HashSet<>(labels));
        }

        Task updated = taskRepository.save(task);
        TaskResponse response = mapToTaskResponse(updated);

        // Log Activity
        Map<String, Object> meta = new HashMap<>();
        meta.put("title", updated.getTitle());
        meta.put("status", updated.getStatus());
        activityService.logActivity(task.getProject().getId(), userId, "updated_task", "task", taskId, meta);

        // Notify new assignee if changed
        if (updated.getAssignee() != null && !updated.getAssignee().getId().equals(oldAssigneeId) && !updated.getAssignee().getId().equals(userId)) {
            User updater = userRepository.findById(userId).orElse(null);
            String updaterName = updater != null ? updater.getName() : "A team member";
            notificationService.createNotification(
                    updated.getAssignee().getId(),
                    userId,
                    "task_assigned",
                    "Task Assigned",
                    updaterName + " assigned you to \"" + updated.getTitle() + "\"",
                    "/projects/" + task.getProject().getId() + "?task=" + taskId
            );
        }

        // Real-time broadcast
        realtimeMessagingService.emitToProject(task.getProject().getId(), "task:updated", response);

        return response;
    }

    @Override
    @Transactional
    public void reorderTasks(Long projectId, TaskReorderRequest request) {
        if (request.getItems() != null) {
            for (TaskReorderRequest.ReorderItem item : request.getItems()) {
                taskRepository.updateTaskStatusAndPosition(item.getId(), item.getStatus(), item.getPosition());
            }
            realtimeMessagingService.emitToProject(projectId, "tasks:reordered", request);
        }
    }

    @Override
    @Transactional
    public void deleteTask(Long taskId, Long userId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found."));
        Long projectId = task.getProject().getId();
        taskRepository.delete(task);

        Map<String, Object> broadcastData = new HashMap<>();
        broadcastData.put("taskId", taskId);
        realtimeMessagingService.emitToProject(projectId, "task:deleted", broadcastData);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskResponse> getUserTasks(Long userId, String status, String priority, String filter) {
        boolean dueToday = "due_today".equalsIgnoreCase(filter);
        boolean overdue = "overdue".equalsIgnoreCase(filter);
        boolean completed = "completed".equalsIgnoreCase(filter);

        List<Task> tasks = taskRepository.findUserTasks(userId, status, priority, dueToday, overdue, completed);
        return tasks.stream().map(this::mapToTaskResponse).toList();
    }

    private TaskResponse mapToTaskResponse(Task task) {
        TaskResponse res = new TaskResponse();
        res.setId(task.getId());
        res.setProjectId(task.getProject().getId());
        res.setProjectName(task.getProject().getName());
        res.setProjectColor(task.getProject().getColor());
        res.setTitle(task.getTitle());
        res.setDescription(task.getDescription());
        res.setStatus(task.getStatus());
        res.setPriority(task.getPriority());
        res.setPosition(task.getPosition());

        if (task.getAssignee() != null) {
            res.setAssigneeId(task.getAssignee().getId());
            res.setAssigneeName(task.getAssignee().getName());
            res.setAssigneeAvatar(task.getAssignee().getAvatarUrl());
            res.setAssigneeEmail(task.getAssignee().getEmail());
        }

        if (task.getCreator() != null) {
            res.setCreatorId(task.getCreator().getId());
            res.setCreatorName(task.getCreator().getName());
            res.setCreatorAvatar(task.getCreator().getAvatarUrl());
        }

        res.setDueDate(task.getDueDate());
        res.setCreatedAt(task.getCreatedAt());
        res.setUpdatedAt(task.getUpdatedAt());

        res.setCommentsCount(commentRepository.countByTaskId(task.getId()));
        res.setAttachmentsCount(attachmentRepository.countByTaskId(task.getId()));

        if (task.getLabels() != null) {
            res.setLabels(task.getLabels().stream().map(LabelDto::fromEntity).toList());
        }

        return res;
    }
}
