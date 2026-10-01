package com.taskflow.backend.service;

import com.taskflow.backend.dto.task.TaskCreateRequest;
import com.taskflow.backend.dto.task.TaskReorderRequest;
import com.taskflow.backend.dto.task.TaskResponse;
import com.taskflow.backend.dto.task.TaskUpdateRequest;

import java.util.List;

public interface TaskService {
    List<TaskResponse> getProjectTasks(Long projectId);
    TaskResponse getTaskById(Long taskId);
    TaskResponse createTask(Long projectId, Long creatorId, TaskCreateRequest request);
    TaskResponse updateTask(Long taskId, Long userId, TaskUpdateRequest request);
    void reorderTasks(Long projectId, TaskReorderRequest request);
    void deleteTask(Long taskId, Long userId);
    List<TaskResponse> getUserTasks(Long userId, String status, String priority, String filter);
}
