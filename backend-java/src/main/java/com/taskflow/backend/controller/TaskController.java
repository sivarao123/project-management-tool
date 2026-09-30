package com.taskflow.backend.controller;

import com.taskflow.backend.dto.task.TaskCreateRequest;
import com.taskflow.backend.dto.task.TaskReorderRequest;
import com.taskflow.backend.dto.task.TaskResponse;
import com.taskflow.backend.dto.task.TaskUpdateRequest;
import com.taskflow.backend.security.UserPrincipal;
import com.taskflow.backend.service.TaskService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    // --- Nested under /api/projects/{projectId}/tasks ---

    @GetMapping("/api/projects/{projectId}/tasks")
    @PreAuthorize("@projectSecurity.hasProjectRole(#projectId, 'VIEWER')")
    public ResponseEntity<Map<String, Object>> getProjectTasks(@PathVariable Long projectId) {
        List<TaskResponse> tasks = taskService.getProjectTasks(projectId);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("tasks", tasks);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/api/projects/{projectId}/tasks")
    @PreAuthorize("@projectSecurity.hasProjectRole(#projectId, 'MEMBER')")
    public ResponseEntity<Map<String, Object>> createTask(
            @PathVariable Long projectId,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody TaskCreateRequest request) {
        TaskResponse task = taskService.createTask(projectId, principal.getId(), request);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Task created successfully.");
        response.put("task", task);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/api/projects/{projectId}/tasks/reorder")
    @PreAuthorize("@projectSecurity.hasProjectRole(#projectId, 'MEMBER')")
    public ResponseEntity<Map<String, Object>> reorderTasks(
            @PathVariable Long projectId,
            @Valid @RequestBody TaskReorderRequest request) {
        taskService.reorderTasks(projectId, request);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Tasks reordered successfully.");
        return ResponseEntity.ok(response);
    }

    // --- Direct under /api/tasks ---

    @GetMapping("/api/tasks/my-tasks")
    public ResponseEntity<Map<String, Object>> getUserTasks(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String filter) {
        List<TaskResponse> tasks = taskService.getUserTasks(principal.getId(), status, priority, filter);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("tasks", tasks);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/tasks/{id}")
    public ResponseEntity<Map<String, Object>> getTaskById(@PathVariable Long id) {
        TaskResponse task = taskService.getTaskById(id);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("task", task);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/api/tasks/{id}")
    public ResponseEntity<Map<String, Object>> updateTask(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody TaskUpdateRequest request) {
        TaskResponse task = taskService.updateTask(id, principal.getId(), request);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Task updated successfully.");
        response.put("task", task);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/api/tasks/{id}")
    public ResponseEntity<Map<String, Object>> deleteTask(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        taskService.deleteTask(id, principal.getId());
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Task deleted successfully.");
        return ResponseEntity.ok(response);
    }
}
