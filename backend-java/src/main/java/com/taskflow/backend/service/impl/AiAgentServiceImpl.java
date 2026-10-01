package com.taskflow.backend.service.impl;

import com.taskflow.backend.dto.ai.AiActionItem;
import com.taskflow.backend.dto.ai.AiAgentResponse;
import com.taskflow.backend.dto.ai.AiEnhanceTaskResponse;
import com.taskflow.backend.dto.ai.AiStepDto;
import com.taskflow.backend.dto.task.TaskResponse;
import com.taskflow.backend.entity.Project;
import com.taskflow.backend.entity.ProjectMember;
import com.taskflow.backend.entity.Task;
import com.taskflow.backend.entity.User;
import com.taskflow.backend.exception.BadRequestException;
import com.taskflow.backend.exception.ResourceNotFoundException;
import com.taskflow.backend.repository.ProjectMemberRepository;
import com.taskflow.backend.repository.ProjectRepository;
import com.taskflow.backend.repository.TaskRepository;
import com.taskflow.backend.repository.UserRepository;
import com.taskflow.backend.service.ActivityService;
import com.taskflow.backend.service.AiAgentService;
import com.taskflow.backend.service.RealtimeMessagingService;
import com.taskflow.backend.service.TaskService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Service
public class AiAgentServiceImpl implements AiAgentService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final TaskService taskService;
    private final ActivityService activityService;
    private final RealtimeMessagingService realtimeMessagingService;

    public AiAgentServiceImpl(ProjectRepository projectRepository,
                             ProjectMemberRepository projectMemberRepository,
                             TaskRepository taskRepository,
                             UserRepository userRepository,
                             TaskService taskService,
                             ActivityService activityService,
                             RealtimeMessagingService realtimeMessagingService) {
        this.projectRepository = projectRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.taskService = taskService;
        this.activityService = activityService;
        this.realtimeMessagingService = realtimeMessagingService;
    }

    @Override
    @Transactional(readOnly = true)
    public AiAgentResponse runAgentChat(String prompt, Long projectId, Long userId) {
        List<AiStepDto> steps = new ArrayList<>();
        steps.add(new AiStepDto("interpret_intent", "Parsing user request & intent...", prompt));

        Project project = null;
        if (projectId != null) {
            steps.add(new AiStepDto("fetch_context", "Inspecting PostgreSQL project telemetry...", "Project ID: " + projectId));
            project = projectRepository.findById(projectId).orElse(null);
        } else {
            steps.add(new AiStepDto("fetch_context", "Inspecting global workspace telemetry...", "Workspace-wide aggregation"));
        }

        steps.add(new AiStepDto("autonomous_engine", "Running TaskFlow Autonomous Reasoning Engine...", "Multi-step heuristic evaluation & tool dispatch"));

        String lowerPrompt = prompt.toLowerCase();
        String generatedResponse;
        List<AiActionItem> actions = new ArrayList<>();

        if (lowerPrompt.contains("break down") || lowerPrompt.contains("create task") || lowerPrompt.contains("generate task") || lowerPrompt.contains("user stor")) {
            steps.add(new AiStepDto("tool_dispatch", "Dispatched tool: breakdown_feature()", "Decomposing objective into sprint user stories"));
            Map<String, Object> breakdown = breakdownFeature(prompt, projectId);
            generatedResponse = (String) breakdown.get("summary");
            Object acts = breakdown.get("actions");
            if (acts instanceof List<?> l) {
                for (Object item : l) {
                    if (item instanceof AiActionItem act) actions.add(act);
                }
            }
        } else if (lowerPrompt.contains("balance") || lowerPrompt.contains("workload") || lowerPrompt.contains("assign") || lowerPrompt.contains("overload")) {
            steps.add(new AiStepDto("tool_dispatch", "Dispatched tool: rebalance_workload()", "Evaluating team bandwidth & capacity distributions"));
            Map<String, Object> balance = balanceWorkload(project);
            generatedResponse = (String) balance.get("summary");
            Object acts = balance.get("actions");
            if (acts instanceof List<?> l) {
                for (Object item : l) {
                    if (item instanceof AiActionItem act) actions.add(act);
                }
            }
        } else if (lowerPrompt.contains("standup") || lowerPrompt.contains("summary") || lowerPrompt.contains("status") || lowerPrompt.contains("health") || lowerPrompt.contains("blocker")) {
            steps.add(new AiStepDto("tool_dispatch", "Dispatched tool: inspect_project_metrics()", "Synthesizing burndown, progress & overdue flags"));
            Map<String, Object> standup = generateStandup(projectId);
            generatedResponse = (String) standup.get("summary");
            Object acts = standup.get("actions");
            if (acts instanceof List<?> l) {
                for (Object item : l) {
                    if (item instanceof AiActionItem act) actions.add(act);
                }
            }
        } else {
            steps.add(new AiStepDto("tool_dispatch", "Dispatched tool: general_copilot_assistant()", "Analyzing general project queries"));
            generatedResponse = buildGeneralResponse(prompt, project);
        }

        steps.add(new AiStepDto("finalize_execution", "Action recommendations ready for review", actions.size() + " proposed actions generated."));

        return new AiAgentResponse(true, "taskflow-autonomous-agent", steps, generatedResponse, actions);
    }

    @Override
    public Map<String, Object> breakdownFeature(String prompt, Long projectId) {
        String cleanedTopic = prompt
                .replaceAll("(?i)(break down|create tasks for|generate tasks for|user stories for|can you|please)", "")
                .trim();
        if (cleanedTopic.isEmpty()) {
            cleanedTopic = "New System Capability";
        }

        String titlePrefix = Character.toUpperCase(cleanedTopic.charAt(0)) + (cleanedTopic.length() > 1 ? cleanedTopic.substring(1) : "");

        List<AiActionItem> actions = new ArrayList<>();

        AiActionItem a1 = new AiActionItem();
        a1.setId("act-" + System.currentTimeMillis() + "-1");
        a1.setType("create_task");
        a1.setTitle(titlePrefix + ": Architecture Design & Data Modeling");
        a1.setDescription("Define PostgreSQL schema, database migration scripts, indexes, and API contract specifications for " + titlePrefix + ".\n\n### Acceptance Criteria:\n- [ ] Database schema defined with proper foreign keys.\n- [ ] REST API endpoints documented with request/response schemas.\n- [ ] Architectural review signed off.");
        a1.setStatus("TODO");
        a1.setPriority("High");
        a1.setDueInDays(3);
        actions.add(a1);

        AiActionItem a2 = new AiActionItem();
        a2.setId("act-" + System.currentTimeMillis() + "-2");
        a2.setType("create_task");
        a2.setTitle(titlePrefix + ": Backend API & Business Logic Implementation");
        a2.setDescription("Implement controllers, service layer verification, input sanitization, and unit tests for " + titlePrefix + ".\n\n### Acceptance Criteria:\n- [ ] CRUD operations with JWT authentication guards.\n- [ ] Error handling with informative HTTP status codes.\n- [ ] Automated integration test coverage >= 80%.");
        a2.setStatus("TODO");
        a2.setPriority("Urgent");
        a2.setDueInDays(5);
        actions.add(a2);

        AiActionItem a3 = new AiActionItem();
        a3.setId("act-" + System.currentTimeMillis() + "-3");
        a3.setType("create_task");
        a3.setTitle(titlePrefix + ": Interactive Frontend UI & Real-Time Sync");
        a3.setDescription("Develop responsive React 18 component, integrate Tailwind styling, connect API client, and hook into Socket.io events.\n\n### Acceptance Criteria:\n- [ ] Mobile-responsive layout matching design system.\n- [ ] Optimistic UI state updates on user interactions.\n- [ ] Live WebSocket event listeners for multi-window synchronization.");
        a3.setStatus("TODO");
        a3.setPriority("High");
        a3.setDueInDays(7);
        actions.add(a3);

        AiActionItem a4 = new AiActionItem();
        a4.setId("act-" + System.currentTimeMillis() + "-4");
        a4.setType("create_task");
        a4.setTitle(titlePrefix + ": End-to-End QA & Staging Verification");
        a4.setDescription("Conduct end-to-end integration testing, edge-case validation, performance benchmarks, and accessibility audit (WCAG AA).\n\n### Acceptance Criteria:\n- [ ] Zero blocking console errors or memory leaks.\n- [ ] Cross-browser verified (Chrome, Safari, Firefox).\n- [ ] Production build verified in staging environment.");
        a4.setStatus("BACKLOG");
        a4.setPriority("Medium");
        a4.setDueInDays(10);
        actions.add(a4);

        String summary = "### 🎯 Sprint Breakdown: **" + titlePrefix + "**\n" +
                "I have analyzed the technical scope and decomposed this initiative into **4 sprint-ready engineering tasks** with detailed acceptance criteria and recommended priorities:\n\n" +
                "1. **Architecture Design & Data Modeling** *(Priority: High, 3-day target)*\n" +
                "2. **Backend API & Business Logic Implementation** *(Priority: Urgent, 5-day target)*\n" +
                "3. **Interactive Frontend UI & Real-Time Sync** *(Priority: High, 7-day target)*\n" +
                "4. **End-to-End QA & Staging Verification** *(Priority: Medium, 10-day target)*\n\n" +
                "You can inspect the proposed action items below and click **\"Apply to Board\"** to create them instantly in PostgreSQL.";

        Map<String, Object> result = new HashMap<>();
        result.put("summary", summary);
        result.put("actions", actions);
        return result;
    }

    @Override
    public AiEnhanceTaskResponse enhanceTask(String title, String description) {
        String cleanTitle = (title != null && !title.isBlank()) ? title.trim() : "System Task";

        String enhancedDescription = (description != null && !description.isBlank() ? description + "\n\n" : "") +
                "### 📋 Acceptance Criteria (AI Generated)\n" +
                "- [ ] Implement core functionality with unit test coverage.\n" +
                "- [ ] Ensure proper input validation, error handling, and security sanitization.\n" +
                "- [ ] Verify responsive UI layout across desktop, tablet, and mobile viewports.\n" +
                "- [ ] Connect WebSocket real-time event broadcasting on mutation.\n\n" +
                "### 🛠️ Technical Implementation Notes\n" +
                "- **API Protocol:** REST endpoint with JWT header authentication.\n" +
                "- **Database Consistency:** PostgreSQL transactional update with foreign key validation.\n" +
                "- **Client Sync:** Optimistic cache update with fallback rollback on network failure.";

        List<Map<String, Object>> subtasks = new ArrayList<>();
        subtasks.add(Map.of("text", "Draft API specification and schema requirements", "completed", false));
        subtasks.add(Map.of("text", "Implement backend controller logic & database queries", "completed", false));
        subtasks.add(Map.of("text", "Build responsive frontend interface with error boundaries", "completed", false));
        subtasks.add(Map.of("text", "Run integration test suite & verify multi-window sync", "completed", false));

        String priority = "Medium";
        String lower = cleanTitle.toLowerCase();
        if (lower.contains("security") || lower.contains("auth") || lower.contains("bug") || lower.contains("payment") || lower.contains("urgent")) {
            priority = "Urgent";
        } else if (lower.contains("api") || lower.contains("database") || lower.contains("redesign") || lower.contains("sync")) {
            priority = "High";
        }

        int estimateDays = "Urgent".equals(priority) ? 2 : 5;

        return new AiEnhanceTaskResponse(true, enhancedDescription, subtasks, priority, estimateDays);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> generateStandup(Long projectId) {
        List<Task> tasks;
        String projName = "Active Workspace";

        if (projectId != null) {
            Project p = projectRepository.findById(projectId).orElse(null);
            if (p != null) projName = p.getName();
            tasks = taskRepository.findByProjectIdWithRelations(projectId);
        } else {
            tasks = taskRepository.findAll();
        }

        long totalTasks = tasks.size();
        long doneTasks = tasks.stream().filter(t -> "DONE".equalsIgnoreCase(t.getStatus())).count();
        long inProgressTasks = tasks.stream().filter(t -> "IN PROGRESS".equalsIgnoreCase(t.getStatus())).count();
        long inReviewTasks = tasks.stream().filter(t -> "IN REVIEW".equalsIgnoreCase(t.getStatus())).count();
        long todoTasks = tasks.stream().filter(t -> "TODO".equalsIgnoreCase(t.getStatus()) || "BACKLOG".equalsIgnoreCase(t.getStatus())).count();

        LocalDate today = LocalDate.now();
        List<Task> overdue = tasks.stream()
                .filter(t -> t.getDueDate() != null && t.getDueDate().isBefore(today) && !"DONE".equalsIgnoreCase(t.getStatus()))
                .toList();

        int completionRate = totalTasks > 0 ? (int) Math.round(((double) doneTasks / totalTasks) * 100) : 0;

        List<AiActionItem> actions = new ArrayList<>();
        StringBuilder summary = new StringBuilder();
        summary.append("### 📊 Sprint Intelligence Briefing: **").append(projName).append("**\n\n");
        summary.append("**Executive Metrics:**\n");
        summary.append("- **Sprint Progress:** `").append(completionRate).append("% complete` (").append(doneTasks).append("/").append(totalTasks).append(" tasks resolved)\n");
        summary.append("- **Active In Progress:** `").append(inProgressTasks).append(" tasks`\n");
        summary.append("- **In Review / Verification:** `").append(inReviewTasks).append(" tasks`\n");
        summary.append("- **Pending / To-Do:** `").append(todoTasks).append(" tasks`\n");

        if (!overdue.isEmpty()) {
            summary.append("\n🚨 **Attention Needed - ").append(overdue.size()).append(" Overdue Item(s):**\n");
            for (Task ot : overdue) {
                String assignee = ot.getAssignee() != null ? ot.getAssignee().getName() : "Unassigned";
                summary.append("- **\"").append(ot.getTitle()).append("\"** (Assigned to: ").append(assignee).append(") — Due: ").append(ot.getDueDate()).append("\n");

                AiActionItem act = new AiActionItem();
                act.setId("act-overdue-" + ot.getId());
                act.setType("update_priority");
                act.setTaskId(ot.getId());
                act.setTitle(ot.getTitle());
                act.setPriority("Urgent");
                act.setReason("Flagged by Agent: Deadline has passed");
                actions.add(act);
            }
        } else {
            summary.append("\n✅ **Deadline Health:** No overdue tasks detected. Sprint velocity is currently on track.\n");
        }

        if (inReviewTasks >= 3) {
            summary.append("\n⚠️ **Bottleneck Advisory:** There are ").append(inReviewTasks).append(" cards waiting in \"IN REVIEW\". Consider scheduling a code review synchronization to unlock deployment.\n");
        }

        Map<String, Object> result = new HashMap<>();
        result.put("summary", summary.toString());
        result.put("actions", actions);
        return result;
    }

    private Map<String, Object> balanceWorkload(Project project) {
        List<ProjectMember> members = project != null
                ? projectMemberRepository.findByProjectIdOrderByJoinedAtAsc(project.getId())
                : Collections.emptyList();

        if (members.isEmpty()) {
            Map<String, Object> res = new HashMap<>();
            res.put("summary", "### ⚖️ Workload Assessment\nNo team member data found for this context. Please ensure members are assigned to the project.");
            res.put("actions", Collections.emptyList());
            return res;
        }

        StringBuilder summary = new StringBuilder("### ⚖️ Team Workload & Capacity Analysis\n\n");
        summary.append("Here is the current distribution of active (unfinished) tasks:\n");
        for (ProjectMember pm : members) {
            long active = taskRepository.countActiveTasksByAssigneeId(pm.getUser().getId());
            summary.append("- **").append(pm.getUser().getName()).append("** (").append(pm.getRole()).append("): `")
                    .append(active).append(" active tasks`\n");
        }
        summary.append("\n✅ **Workload Health**: Team distribution evaluated. Keep active tickets within individual capacity.\n");

        Map<String, Object> res = new HashMap<>();
        res.put("summary", summary.toString());
        res.put("actions", Collections.emptyList());
        return res;
    }

    private String buildGeneralResponse(String prompt, Project project) {
        String projName = project != null ? project.getName() : "TaskFlow";
        return "### 🤖 TaskFlow Copilot Assistant\n\n" +
                "I have evaluated your request regarding **" + projName + "**.\n\n" +
                "Here is how I can assist your team right now:\n\n" +
                "1. **Feature to Sprint Decomposition**: Tell me a feature (e.g., *\"Break down OAuth authentication\"*) and I will generate structured user stories with acceptance criteria.\n" +
                "2. **Sprint Health & Blocker Analysis**: Ask for *\"Sprint health\"* or *\"Daily standup summary\"* to inspect velocity, completion rates, and bottlenecks.\n" +
                "3. **Workload Balancing**: Ask *\"Balance team workload\"* to automatically recommend task allocations based on team bandwidth.\n" +
                "4. **Task Enhancement**: Open any card and use *\"AI Enhance\"* to generate technical specifications and subtasks.\n\n" +
                "What would you like to execute next?";
    }

    @Override
    @Transactional
    public Map<String, Object> executeActions(Long projectId, Long userId, List<AiActionItem> actions) {
        if (actions == null || actions.isEmpty()) {
            throw new BadRequestException("No actions to execute.");
        }

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found."));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        List<Map<String, Object>> results = new ArrayList<>();
        LocalDate today = LocalDate.now();

        for (AiActionItem act : actions) {
            if ("create_task".equalsIgnoreCase(act.getType())) {
                int dueOffset = act.getDueInDays() != null ? act.getDueInDays() : 5;
                LocalDate dueDate = today.plusDays(dueOffset);

                String status = act.getStatus() != null ? act.getStatus() : "TODO";
                String priority = act.getPriority() != null ? act.getPriority() : "Medium";
                Integer position = taskRepository.getNextPosition(projectId, status);

                User assignee = null;
                if (act.getAssigneeId() != null) {
                    assignee = userRepository.findById(act.getAssigneeId()).orElse(null);
                }

                Task newTask = Task.builder()
                        .project(project)
                        .title(act.getTitle())
                        .description(act.getDescription() != null ? act.getDescription() : "")
                        .status(status)
                        .priority(priority)
                        .position(position)
                        .assignee(assignee)
                        .creator(user)
                        .dueDate(dueDate)
                        .build();

                Task saved = taskRepository.save(newTask);
                TaskResponse taskResp = taskService.getTaskById(saved.getId());

                Map<String, Object> meta = new HashMap<>();
                meta.put("title", saved.getTitle());
                meta.put("source", "TaskFlow AI Agent");
                activityService.logActivity(projectId, userId, "created_task", "task", saved.getId(), meta);

                realtimeMessagingService.emitToProject(projectId, "task:created", taskResp);

                Map<String, Object> itemResult = new HashMap<>();
                itemResult.put("action", "create_task");
                itemResult.put("taskId", saved.getId());
                itemResult.put("title", saved.getTitle());
                itemResult.put("status", "success");
                results.add(itemResult);

            } else if ("reassign_task".equalsIgnoreCase(act.getType()) && act.getTaskId() != null) {
                Task task = taskRepository.findById(act.getTaskId()).orElse(null);
                if (task != null && act.getNewAssigneeId() != null) {
                    User newAssignee = userRepository.findById(act.getNewAssigneeId()).orElse(null);
                    task.setAssignee(newAssignee);
                    taskRepository.save(task);

                    TaskResponse taskResp = taskService.getTaskById(task.getId());
                    realtimeMessagingService.emitToProject(projectId, "task:updated", taskResp);

                    Map<String, Object> meta = new HashMap<>();
                    meta.put("assigneeName", act.getNewAssigneeName());
                    meta.put("source", "TaskFlow AI Agent");
                    activityService.logActivity(projectId, userId, "assigned_task", "task", task.getId(), meta);

                    Map<String, Object> itemResult = new HashMap<>();
                    itemResult.put("action", "reassign_task");
                    itemResult.put("taskId", task.getId());
                    itemResult.put("status", "success");
                    results.add(itemResult);
                }

            } else if ("update_priority".equalsIgnoreCase(act.getType()) && act.getTaskId() != null) {
                Task task = taskRepository.findById(act.getTaskId()).orElse(null);
                if (task != null && act.getPriority() != null) {
                    task.setPriority(act.getPriority());
                    taskRepository.save(task);

                    TaskResponse taskResp = taskService.getTaskById(task.getId());
                    realtimeMessagingService.emitToProject(projectId, "task:updated", taskResp);

                    Map<String, Object> itemResult = new HashMap<>();
                    itemResult.put("action", "update_priority");
                    itemResult.put("taskId", task.getId());
                    itemResult.put("status", "success");
                    results.add(itemResult);
                }
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Successfully executed " + results.size() + " AI action(s).");
        response.put("executedCount", results.size());
        response.put("results", results);
        return response;
    }
}
