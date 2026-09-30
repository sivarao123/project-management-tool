package com.taskflow.backend.service.impl;

import com.taskflow.backend.dto.member.AddMemberRequest;
import com.taskflow.backend.dto.member.MemberResponse;
import com.taskflow.backend.dto.member.UpdateRoleRequest;
import com.taskflow.backend.entity.Project;
import com.taskflow.backend.entity.ProjectMember;
import com.taskflow.backend.entity.User;
import com.taskflow.backend.exception.BadRequestException;
import com.taskflow.backend.exception.ResourceNotFoundException;
import com.taskflow.backend.repository.ProjectMemberRepository;
import com.taskflow.backend.repository.ProjectRepository;
import com.taskflow.backend.repository.UserRepository;
import com.taskflow.backend.service.MemberService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class MemberServiceImpl implements MemberService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final UserRepository userRepository;

    public MemberServiceImpl(ProjectRepository projectRepository,
                             ProjectMemberRepository projectMemberRepository,
                             UserRepository userRepository) {
        this.projectRepository = projectRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<MemberResponse> getProjectMembers(Long projectId) {
        return projectMemberRepository.findByProjectIdOrderByJoinedAtAsc(projectId)
                .stream()
                .map(pm -> new MemberResponse(
                        pm.getId(),
                        pm.getRole(),
                        pm.getJoinedAt(),
                        pm.getUser().getId(),
                        pm.getUser().getName(),
                        pm.getUser().getEmail(),
                        pm.getUser().getAvatarUrl()
                ))
                .toList();
    }

    @Override
    @Transactional
    public MemberResponse addMember(Long projectId, Long currentUserId, AddMemberRequest request) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found."));

        Long targetUserId = request.getUserId();
        if (targetUserId == null && request.getEmail() != null && !request.getEmail().isBlank()) {
            User user = userRepository.findByEmailIgnoreCase(request.getEmail().trim())
                    .orElseThrow(() -> new ResourceNotFoundException("No user found with email " + request.getEmail()));
            targetUserId = user.getId();
        }

        if (targetUserId == null) {
            throw new BadRequestException("Please provide user email or ID.");
        }

        if (projectMemberRepository.existsByProjectIdAndUserId(projectId, targetUserId)) {
            throw new BadRequestException("User is already a member of this project.");
        }

        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        String role = request.getRole() != null ? request.getRole() : "Member";

        ProjectMember member = ProjectMember.builder()
                .project(project)
                .user(targetUser)
                .role(role)
                .build();

        ProjectMember saved = projectMemberRepository.save(member);

        return new MemberResponse(
                saved.getId(),
                saved.getRole(),
                saved.getJoinedAt(),
                targetUser.getId(),
                targetUser.getName(),
                targetUser.getEmail(),
                targetUser.getAvatarUrl()
        );
    }

    @Override
    @Transactional
    public void updateMemberRole(Long projectId, Long targetUserId, UpdateRoleRequest request) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found."));

        if (project.getOwner().getId().equals(targetUserId) && !"Owner".equalsIgnoreCase(request.getRole())) {
            throw new BadRequestException("Cannot demote the primary project owner.");
        }

        ProjectMember member = projectMemberRepository.findByProjectIdAndUserId(projectId, targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found in project."));

        member.setRole(request.getRole());
        projectMemberRepository.save(member);
    }

    @Override
    @Transactional
    public void removeMember(Long projectId, Long targetUserId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found."));

        if (project.getOwner().getId().equals(targetUserId)) {
            throw new BadRequestException("Cannot remove the primary project owner.");
        }

        projectMemberRepository.deleteByProjectIdAndUserId(projectId, targetUserId);
    }
}
