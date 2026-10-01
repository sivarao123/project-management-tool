package com.taskflow.backend.service.impl;

import com.taskflow.backend.dto.user.AssignUserProjectRequest;
import com.taskflow.backend.dto.user.TeamUserDto;
import com.taskflow.backend.dto.user.UserProjectDto;
import com.taskflow.backend.entity.Project;
import com.taskflow.backend.entity.ProjectMember;
import com.taskflow.backend.entity.User;
import com.taskflow.backend.exception.BadRequestException;
import com.taskflow.backend.exception.ResourceNotFoundException;
import com.taskflow.backend.exception.UnauthorizedException;
import com.taskflow.backend.repository.ProjectMemberRepository;
import com.taskflow.backend.repository.ProjectRepository;
import com.taskflow.backend.repository.TaskRepository;
import com.taskflow.backend.repository.UserRepository;
import com.taskflow.backend.service.ActivityService;
import com.taskflow.backend.service.NotificationService;
import com.taskflow.backend.service.RealtimeMessagingService;
import com.taskflow.backend.service.UserService;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final TaskRepository taskRepository;
    private final ActivityService activityService;
    private final NotificationService notificationService;
    private final RealtimeMessagingService realtimeMessagingService;

    public UserServiceImpl(UserRepository userRepository,
                           ProjectRepository projectRepository,
                           ProjectMemberRepository projectMemberRepository,
                           TaskRepository taskRepository,
                           ActivityService activityService,
                           NotificationService notificationService,
                           RealtimeMessagingService realtimeMessagingService) {
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.taskRepository = taskRepository;
        this.activityService = activityService;
        this.notificationService = notificationService;
        this.realtimeMessagingService = realtimeMessagingService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<TeamUserDto> getAllUsers() {
        List<User> users = userRepository.findAll(Sort.by(Sort.Direction.ASC, "name"));

        // Preload active tasks count per user
        Map<Long, Long> taskCountMap = new HashMap<>();
        List<Object[]> taskCounts = taskRepository.countActiveTasksGroupedByAssignee();
        for (Object[] row : taskCounts) {
            if (row[0] != null && row[1] != null) {
                taskCountMap.put(((Number) row[0]).longValue(), ((Number) row[1]).longValue());
            }
        }

        // Preload active project memberships per user
        Map<Long, List<UserProjectDto>> userProjectsMap = new HashMap<>();
        List<ProjectMember> allMemberships = projectMemberRepository.findAllWithActiveProject();
        for (ProjectMember pm : allMemberships) {
            Long uid = pm.getUser().getId();
            userProjectsMap.computeIfAbsent(uid, k -> new ArrayList<>()).add(new UserProjectDto(
                    pm.getProject().getId(),
                    pm.getProject().getName(),
                    pm.getProject().getColor(),
                    pm.getRole()
            ));
        }

        List<TeamUserDto> result = new ArrayList<>();
        for (User u : users) {
            TeamUserDto dto = new TeamUserDto();
            dto.setId(u.getId());
            dto.setName(u.getName());
            dto.setEmail(u.getEmail());
            dto.setAvatarUrl(u.getAvatarUrl());
            dto.setRole(u.getRole());
            dto.setBio(u.getBio());
            dto.setCreatedAt(u.getCreatedAt());

            List<UserProjectDto> projs = userProjectsMap.getOrDefault(u.getId(), Collections.emptyList());
            dto.setProjects(projs);
            dto.setProjectCount(projs.size());
            dto.setActiveTasksCount(taskCountMap.getOrDefault(u.getId(), 0L));

            result.add(dto);
        }

        return result;
    }

    @Override
    @Transactional
    public List<UserProjectDto> assignUserToProject(Long targetUserId, Long currentUserId, AssignUserProjectRequest request) {
        Long projectId = request.getProjectId();
        String role = request.getRole() != null ? request.getRole() : "Member";

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found."));

        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        // Check permission: current user must be owner or admin of the project
        boolean isOwner = project.getOwner().getId().equals(currentUserId);
        Optional<ProjectMember> currentMemberOpt = projectMemberRepository.findByProjectIdAndUserId(projectId, currentUserId);
        boolean isAdmin = currentMemberOpt.isPresent() &&
                ("Admin".equalsIgnoreCase(currentMemberOpt.get().getRole()) || "Owner".equalsIgnoreCase(currentMemberOpt.get().getRole()));

        if (!isOwner && !isAdmin) {
            throw new UnauthorizedException("Only project owners or admins can assign members to this project.");
        }

        // Check if already a member
        if (projectMemberRepository.existsByProjectIdAndUserId(projectId, targetUserId)) {
            throw new BadRequestException(targetUser.getName() + " is already a member of " + project.getName() + ".");
        }

        ProjectMember newMember = ProjectMember.builder()
                .project(project)
                .user(targetUser)
                .role(role)
                .build();
        projectMemberRepository.save(newMember);

        // Log activity & notify
        Map<String, Object> meta = new HashMap<>();
        meta.put("userName", targetUser.getName());
        meta.put("role", role);
        activityService.logActivity(projectId, currentUserId, "added_member", "user", targetUserId, meta);

        notificationService.createNotification(
                targetUserId,
                currentUserId,
                "project_invite",
                "Added to Project",
                "You were added to project \"" + project.getName() + "\" as " + role,
                "/projects/" + projectId
        );

        // Global emit
        Map<String, Object> emitData = new HashMap<>();
        emitData.put("userId", targetUserId);
        Map<String, Object> projectData = new HashMap<>();
        projectData.put("id", project.getId());
        projectData.put("name", project.getName());
        projectData.put("color", project.getColor());
        projectData.put("role", role);
        emitData.put("project", projectData);
        realtimeMessagingService.emitGlobal("team:member_assigned", emitData);

        // Fetch updated user projects
        List<ProjectMember> updatedList = projectMemberRepository.findActiveProjectsByUserId(targetUserId);
        return updatedList.stream().map(pm -> new UserProjectDto(
                pm.getProject().getId(),
                pm.getProject().getName(),
                pm.getProject().getColor(),
                pm.getRole()
        )).toList();
    }

    @Override
    @Transactional
    public void removeUserFromProject(Long targetUserId, Long projectId, Long currentUserId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found."));

        if (targetUserId.equals(project.getOwner().getId())) {
            throw new BadRequestException("Cannot remove the project owner from their project.");
        }

        boolean isOwner = project.getOwner().getId().equals(currentUserId);
        Optional<ProjectMember> currentMemberOpt = projectMemberRepository.findByProjectIdAndUserId(projectId, currentUserId);
        boolean isAdmin = currentMemberOpt.isPresent() &&
                ("Admin".equalsIgnoreCase(currentMemberOpt.get().getRole()) || "Owner".equalsIgnoreCase(currentMemberOpt.get().getRole()));

        if (!isOwner && !isAdmin && !targetUserId.equals(currentUserId)) {
            throw new UnauthorizedException("Permission denied.");
        }

        projectMemberRepository.deleteByProjectIdAndUserId(projectId, targetUserId);

        Map<String, Object> emitData = new HashMap<>();
        emitData.put("userId", targetUserId);
        emitData.put("projectId", projectId);
        realtimeMessagingService.emitGlobal("team:member_unassigned", emitData);
    }
}
