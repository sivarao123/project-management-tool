package com.taskflow.backend.service.impl;

import com.taskflow.backend.dto.member.MemberResponse;
import com.taskflow.backend.dto.project.*;
import com.taskflow.backend.entity.Label;
import com.taskflow.backend.entity.Project;
import com.taskflow.backend.entity.ProjectMember;
import com.taskflow.backend.entity.User;
import com.taskflow.backend.exception.BadRequestException;
import com.taskflow.backend.exception.ResourceNotFoundException;
import com.taskflow.backend.repository.LabelRepository;
import com.taskflow.backend.repository.ProjectMemberRepository;
import com.taskflow.backend.repository.ProjectRepository;
import com.taskflow.backend.repository.UserRepository;
import com.taskflow.backend.service.MemberService;
import com.taskflow.backend.service.ProjectService;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class ProjectServiceImpl implements ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final LabelRepository labelRepository;
    private final UserRepository userRepository;
    private final MemberService memberService;

    public ProjectServiceImpl(ProjectRepository projectRepository,
                              ProjectMemberRepository projectMemberRepository,
                              LabelRepository labelRepository,
                              UserRepository userRepository,
                              MemberService memberService) {
        this.projectRepository = projectRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.labelRepository = labelRepository;
        this.userRepository = userRepository;
        this.memberService = memberService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProjectResponse> getUserProjects(Long userId, boolean includeArchived) {
        List<Project> projects = projectRepository.findUserProjects(userId, includeArchived);

        return projects.stream().map(p -> {
            ProjectResponse res = mapToBasicResponse(p);

            Optional<ProjectMember> pmOpt = projectMemberRepository.findByProjectIdAndUserId(p.getId(), userId);
            String userRole = pmOpt.map(ProjectMember::getRole)
                    .orElse(p.getOwner().getId().equals(userId) ? "Owner" : "Viewer");
            res.setUserRole(userRole);

            long memberCount = projectMemberRepository.countByProjectId(p.getId());
            res.setMemberCount(memberCount > 0 ? memberCount : 1L);

            return res;
        }).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ProjectResponse getProjectById(Long projectId, Long userId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found."));

        ProjectResponse res = mapToBasicResponse(project);

        Optional<ProjectMember> pmOpt = projectMemberRepository.findByProjectIdAndUserId(projectId, userId);
        String userRole = pmOpt.map(ProjectMember::getRole)
                .orElse(project.getOwner().getId().equals(userId) ? "Owner" : "Viewer");
        res.setUserRole(userRole);

        List<MemberResponse> members = memberService.getProjectMembers(projectId);
        res.setMembers(members);

        List<LabelDto> labels = labelRepository.findByProjectIdOrderByIdAsc(projectId)
                .stream()
                .map(LabelDto::fromEntity)
                .toList();
        res.setLabels(labels);

        res.setStats(new ProjectStatsDto(0, 0, 0, 0, 0, 0, 0, 0));

        return res;
    }

    @Override
    @Transactional
    public ProjectResponse createProject(Long userId, ProjectCreateRequest request) {
        User owner = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        Project project = Project.builder()
                .name(request.getName().trim())
                .description(request.getDescription() != null ? request.getDescription() : "")
                .color(request.getColor() != null ? request.getColor() : "#4F46E5")
                .priority(request.getPriority() != null ? request.getPriority() : "Medium")
                .startDate(request.getStartDate() != null ? request.getStartDate() : LocalDate.now())
                .dueDate(request.getDueDate())
                .status("Active")
                .isArchived(false)
                .owner(owner)
                .build();

        Project savedProject = projectRepository.save(project);

        // Add creator as Owner in project_members
        ProjectMember ownerMember = ProjectMember.builder()
                .project(savedProject)
                .user(owner)
                .role("Owner")
                .build();
        projectMemberRepository.save(ownerMember);

        // Default labels
        List<Label> defaultLabels = List.of(
                Label.builder().project(savedProject).name("Frontend").color("#3B82F6").build(),
                Label.builder().project(savedProject).name("Backend").color("#10B981").build(),
                Label.builder().project(savedProject).name("UI/UX").color("#EC4899").build(),
                Label.builder().project(savedProject).name("Bug").color("#EF4444").build(),
                Label.builder().project(savedProject).name("DevOps").color("#8B5CF6").build()
        );
        labelRepository.saveAll(defaultLabels);

        // Add initial members if provided
        if (request.getMembers() != null) {
            for (ProjectCreateRequest.InitialMember m : request.getMembers()) {
                if (m.getUserId() != null && !m.getUserId().equals(userId)) {
                    userRepository.findById(m.getUserId()).ifPresent(u -> {
                        ProjectMember pm = ProjectMember.builder()
                                .project(savedProject)
                                .user(u)
                                .role(m.getRole() != null ? m.getRole() : "Member")
                                .build();
                        projectMemberRepository.save(pm);
                    });
                }
            }
        }

        ProjectResponse res = mapToBasicResponse(savedProject);
        res.setUserRole("Owner");
        res.setMemberCount(1L + (request.getMembers() != null ? request.getMembers().size() : 0));
        res.setStats(new ProjectStatsDto(0, 0, 0, 0, 0, 0, 0, 0));
        return res;
    }

    @Override
    @Transactional
    public ProjectResponse updateProject(Long projectId, Long userId, ProjectUpdateRequest request) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found."));

        if (request.getName() != null && !request.getName().isBlank()) {
            project.setName(request.getName().trim());
        }
        if (request.getDescription() != null) {
            project.setDescription(request.getDescription());
        }
        if (request.getColor() != null) {
            project.setColor(request.getColor());
        }
        if (request.getPriority() != null) {
            project.setPriority(request.getPriority());
        }
        if (request.getStartDate() != null) {
            project.setStartDate(request.getStartDate());
        }
        if (request.getDueDate() != null) {
            project.setDueDate(request.getDueDate());
        }
        if (request.getStatus() != null) {
            project.setStatus(request.getStatus());
        }

        Project updated = projectRepository.save(project);
        return mapToBasicResponse(updated);
    }

    @Override
    @Transactional
    public ProjectResponse archiveProject(Long projectId, Long userId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found."));
        project.setIsArchived(true);
        Project saved = projectRepository.save(project);
        return mapToBasicResponse(saved);
    }

    @Override
    @Transactional
    public ProjectResponse restoreProject(Long projectId, Long userId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found."));
        project.setIsArchived(false);
        Project saved = projectRepository.save(project);
        return mapToBasicResponse(saved);
    }

    @Override
    @Transactional
    public void deleteProject(Long projectId, Long userId, String userRole) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found."));

        boolean isOwner = project.getOwner().getId().equals(userId);
        boolean isAdmin = "ADMIN".equalsIgnoreCase(userRole);

        if (!isOwner && !isAdmin) {
            throw new AccessDeniedException("Only the project owner can delete this project.");
        }

        projectRepository.delete(project);
    }

    private ProjectResponse mapToBasicResponse(Project p) {
        ProjectResponse res = new ProjectResponse();
        res.setId(p.getId());
        res.setName(p.getName());
        res.setDescription(p.getDescription());
        res.setColor(p.getColor());
        res.setPriority(p.getPriority());
        res.setStartDate(p.getStartDate());
        res.setDueDate(p.getDueDate());
        res.setStatus(p.getStatus());
        res.setIsArchived(p.getIsArchived());
        res.setOwnerId(p.getOwner().getId());
        res.setOwnerName(p.getOwner().getName());
        res.setOwnerAvatar(p.getOwner().getAvatarUrl());
        res.setCreatedAt(p.getCreatedAt());
        res.setUpdatedAt(p.getUpdatedAt());
        res.setTotalTasks(0L);
        res.setCompletedTasks(0L);
        res.setProgress(0);
        return res;
    }
}
