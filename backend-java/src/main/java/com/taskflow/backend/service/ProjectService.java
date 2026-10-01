package com.taskflow.backend.service;

import com.taskflow.backend.dto.project.ProjectCreateRequest;
import com.taskflow.backend.dto.project.ProjectResponse;
import com.taskflow.backend.dto.project.ProjectUpdateRequest;

import java.util.List;

public interface ProjectService {
    List<ProjectResponse> getUserProjects(Long userId, boolean includeArchived);
    ProjectResponse getProjectById(Long projectId, Long userId);
    ProjectResponse createProject(Long userId, ProjectCreateRequest request);
    ProjectResponse updateProject(Long projectId, Long userId, ProjectUpdateRequest request);
    ProjectResponse archiveProject(Long projectId, Long userId);
    ProjectResponse restoreProject(Long projectId, Long userId);
    void deleteProject(Long projectId, Long userId, String userRole);
}
