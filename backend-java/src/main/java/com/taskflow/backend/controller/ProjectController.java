package com.taskflow.backend.controller;

import com.taskflow.backend.dto.project.ProjectCreateRequest;
import com.taskflow.backend.dto.project.ProjectResponse;
import com.taskflow.backend.dto.project.ProjectUpdateRequest;
import com.taskflow.backend.security.UserPrincipal;
import com.taskflow.backend.service.ProjectService;
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
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getProjects(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(name = "archived", defaultValue = "false") boolean archived) {
        List<ProjectResponse> projects = projectService.getUserProjects(principal.getId(), archived);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("projects", projects);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createProject(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ProjectCreateRequest request) {
        ProjectResponse project = projectService.createProject(principal.getId(), request);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Project created successfully.");
        response.put("project", project);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("@projectSecurity.hasProjectRole(#id, 'VIEWER')")
    public ResponseEntity<Map<String, Object>> getProjectById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        ProjectResponse project = projectService.getProjectById(id, principal.getId());
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("project", project);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("@projectSecurity.hasProjectRole(#id, 'ADMIN')")
    public ResponseEntity<Map<String, Object>> updateProject(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody ProjectUpdateRequest request) {
        ProjectResponse project = projectService.updateProject(id, principal.getId(), request);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Project updated successfully.");
        response.put("project", project);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@projectSecurity.hasProjectRole(#id, 'OWNER')")
    public ResponseEntity<Map<String, Object>> deleteProject(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        projectService.deleteProject(id, principal.getId(), principal.getRole());
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Project deleted successfully.");
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/archive")
    @PreAuthorize("@projectSecurity.hasProjectRole(#id, 'ADMIN')")
    public ResponseEntity<Map<String, Object>> archiveProject(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        ProjectResponse project = projectService.archiveProject(id, principal.getId());
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Project archived.");
        response.put("project", project);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/restore")
    @PreAuthorize("@projectSecurity.hasProjectRole(#id, 'ADMIN')")
    public ResponseEntity<Map<String, Object>> restoreProject(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        ProjectResponse project = projectService.restoreProject(id, principal.getId());
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Project restored.");
        response.put("project", project);
        return ResponseEntity.ok(response);
    }
}
