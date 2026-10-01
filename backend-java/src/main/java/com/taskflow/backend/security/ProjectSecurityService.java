package com.taskflow.backend.security;

import com.taskflow.backend.entity.Project;
import com.taskflow.backend.entity.ProjectMember;
import com.taskflow.backend.exception.ResourceNotFoundException;
import com.taskflow.backend.repository.ProjectMemberRepository;
import com.taskflow.backend.repository.ProjectRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.Optional;

@Service("projectSecurity")
public class ProjectSecurityService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;

    private static final Map<String, Integer> ROLE_HIERARCHY = Map.of(
            "VIEWER", 1,
            "MEMBER", 2,
            "ADMIN", 3,
            "OWNER", 4
    );

    public ProjectSecurityService(ProjectRepository projectRepository, ProjectMemberRepository projectMemberRepository) {
        this.projectRepository = projectRepository;
        this.projectMemberRepository = projectMemberRepository;
    }

    @Transactional(readOnly = true)
    public boolean hasProjectRole(Long projectId, String requiredRole) {
        if (projectId == null) return false;

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UserPrincipal principal)) {
            return false;
        }

        // Global admin has full access
        if ("ADMIN".equalsIgnoreCase(principal.getRole())) {
            return true;
        }

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found."));

        // If direct owner
        if (project.getOwner().getId().equals(principal.getId())) {
            return true;
        }

        Optional<ProjectMember> memberOpt = projectMemberRepository.findByProjectIdAndUserId(projectId, principal.getId());
        if (memberOpt.isEmpty()) {
            return false;
        }

        String userRole = memberOpt.get().getRole().toUpperCase();
        int userWeight = ROLE_HIERARCHY.getOrDefault(userRole, 0);
        int requiredWeight = ROLE_HIERARCHY.getOrDefault(requiredRole.toUpperCase(), 0);

        return userWeight >= requiredWeight;
    }

    @Transactional(readOnly = true)
    public boolean isProjectOwner(Long projectId) {
        return hasProjectRole(projectId, "OWNER");
    }
}
