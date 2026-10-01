package com.taskflow.backend.service;

import com.taskflow.backend.dto.user.AssignUserProjectRequest;
import com.taskflow.backend.dto.user.TeamUserDto;
import com.taskflow.backend.dto.user.UserProjectDto;
import com.taskflow.backend.entity.Project;
import com.taskflow.backend.entity.ProjectMember;
import com.taskflow.backend.entity.User;
import com.taskflow.backend.exception.BadRequestException;
import com.taskflow.backend.exception.UnauthorizedException;
import com.taskflow.backend.repository.ProjectMemberRepository;
import com.taskflow.backend.repository.ProjectRepository;
import com.taskflow.backend.repository.TaskRepository;
import com.taskflow.backend.repository.UserRepository;
import com.taskflow.backend.service.impl.UserServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private ProjectMemberRepository projectMemberRepository;

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private ActivityService activityService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private RealtimeMessagingService realtimeMessagingService;

    @InjectMocks
    private UserServiceImpl userService;

    private User owner;
    private User target;
    private Project project;

    @BeforeEach
    void setUp() {
        owner = User.builder().id(1L).name("Owner").email("owner@taskflow.dev").build();
        target = User.builder().id(2L).name("Target").email("target@taskflow.dev").build();
        project = Project.builder().id(10L).name("TaskFlow App").color("#4F46E5").owner(owner).build();
    }

    @Test
    @DisplayName("getAllUsers() aggregates user directory, task counts, and projects")
    void testGetAllUsers() {
        when(userRepository.findAll(any(Sort.class))).thenReturn(List.of(owner, target));
        when(taskRepository.countActiveTasksGroupedByAssignee()).thenReturn(Collections.emptyList());
        when(projectMemberRepository.findAllWithActiveProject()).thenReturn(Collections.emptyList());

        List<TeamUserDto> list = userService.getAllUsers();

        assertEquals(2, list.size());
        assertEquals("Owner", list.get(0).getName());
        assertEquals("Target", list.get(1).getName());
    }

    @Test
    @DisplayName("assignUserToProject() assigns user and returns updated projects")
    void testAssignUserToProjectSuccess() {
        AssignUserProjectRequest request = new AssignUserProjectRequest(10L, "Member");

        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
        when(userRepository.findById(2L)).thenReturn(Optional.of(target));
        when(projectMemberRepository.findByProjectIdAndUserId(10L, 1L)).thenReturn(Optional.empty());
        when(projectMemberRepository.existsByProjectIdAndUserId(10L, 2L)).thenReturn(false);

        ProjectMember created = ProjectMember.builder().project(project).user(target).role("Member").build();
        when(projectMemberRepository.findActiveProjectsByUserId(2L)).thenReturn(List.of(created));

        List<UserProjectDto> projs = userService.assignUserToProject(2L, 1L, request);

        assertNotNull(projs);
        assertEquals(1, projs.size());
        assertEquals("TaskFlow App", projs.get(0).getName());

        verify(projectMemberRepository).save(any(ProjectMember.class));
        verify(activityService).logActivity(eq(10L), eq(1L), eq("added_member"), anyString(), eq(2L), any());
        verify(notificationService).createNotification(eq(2L), eq(1L), eq("project_invite"), anyString(), anyString(), anyString());
        verify(realtimeMessagingService).emitGlobal(eq("team:member_assigned"), any());
    }

    @Test
    @DisplayName("assignUserToProject() throws UnauthorizedException when requester lacks permissions")
    void testAssignUserToProjectUnauthorized() {
        AssignUserProjectRequest request = new AssignUserProjectRequest(10L, "Member");

        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
        when(userRepository.findById(2L)).thenReturn(Optional.of(target));
        when(projectMemberRepository.findByProjectIdAndUserId(10L, 99L)).thenReturn(Optional.empty());

        assertThrows(UnauthorizedException.class, () -> userService.assignUserToProject(2L, 99L, request));
    }

    @Test
    @DisplayName("removeUserFromProject() prevents removing project owner")
    void testRemoveProjectOwnerThrows() {
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));

        assertThrows(BadRequestException.class, () -> userService.removeUserFromProject(1L, 10L, 1L));
        verify(projectMemberRepository, never()).deleteByProjectIdAndUserId(anyLong(), anyLong());
    }
}
