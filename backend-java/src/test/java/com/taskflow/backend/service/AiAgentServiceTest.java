package com.taskflow.backend.service;

import com.taskflow.backend.dto.ai.AiActionItem;
import com.taskflow.backend.dto.ai.AiEnhanceTaskResponse;
import com.taskflow.backend.dto.task.TaskResponse;
import com.taskflow.backend.entity.Project;
import com.taskflow.backend.entity.Task;
import com.taskflow.backend.entity.User;
import com.taskflow.backend.repository.ProjectMemberRepository;
import com.taskflow.backend.repository.ProjectRepository;
import com.taskflow.backend.repository.TaskRepository;
import com.taskflow.backend.repository.UserRepository;
import com.taskflow.backend.service.impl.AiAgentServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AiAgentServiceTest {

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private ProjectMemberRepository projectMemberRepository;

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private TaskService taskService;

    @Mock
    private ActivityService activityService;

    @Mock
    private RealtimeMessagingService realtimeMessagingService;

    @InjectMocks
    private AiAgentServiceImpl aiAgentService;

    private Project sampleProject;
    private User sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = User.builder().id(1L).name("Lead Engineer").email("lead@taskflow.dev").build();
        sampleProject = Project.builder().id(10L).name("Cloud Engine").build();
    }

    @Test
    @DisplayName("breakdownFeature() generates sprint user stories with acceptance criteria")
    void testBreakdownFeature() {
        Map<String, Object> result = aiAgentService.breakdownFeature("OAuth2 Social Authentication", 10L);

        assertNotNull(result);
        assertTrue(result.containsKey("summary"));
        assertTrue(result.containsKey("actions"));

        @SuppressWarnings("unchecked")
        List<AiActionItem> actions = (List<AiActionItem>) result.get("actions");
        assertEquals(4, actions.size());
        assertTrue(actions.get(0).getTitle().contains("Architecture Design"));
        assertTrue(actions.get(1).getTitle().contains("Backend API"));
    }

    @Test
    @DisplayName("enhanceTask() generates technical specifications and subtasks")
    void testEnhanceTask() {
        AiEnhanceTaskResponse response = aiAgentService.enhanceTask("Implement Payment Gateway", "Support Stripe");

        assertNotNull(response);
        assertTrue(response.isSuccess());
        assertTrue(response.getEnhancedDescription().contains("Acceptance Criteria"));
        assertEquals(4, response.getSuggestedSubtasks().size());
        assertEquals("Urgent", response.getSuggestedPriority());
    }

    @Test
    @DisplayName("executeActions() batches and creates tasks into database")
    void testExecuteActions() {
        when(projectRepository.findById(10L)).thenReturn(Optional.of(sampleProject));
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(taskRepository.getNextPosition(eq(10L), anyString())).thenReturn(0);
        when(taskRepository.save(any(Task.class))).thenAnswer(invocation -> {
            Task t = invocation.getArgument(0);
            t.setId(301L);
            return t;
        });

        TaskResponse taskResp = new TaskResponse();
        taskResp.setId(301L);
        taskResp.setTitle("Action Task");
        when(taskService.getTaskById(301L)).thenReturn(taskResp);

        AiActionItem item = new AiActionItem();
        item.setType("create_task");
        item.setTitle("Action Task");
        item.setStatus("TODO");
        item.setPriority("High");

        Map<String, Object> response = aiAgentService.executeActions(10L, 1L, List.of(item));

        assertNotNull(response);
        assertTrue((Boolean) response.get("success"));
        assertEquals(1, response.get("executedCount"));
        verify(realtimeMessagingService).emitToProject(eq(10L), eq("task:created"), eq(taskResp));
    }
}
