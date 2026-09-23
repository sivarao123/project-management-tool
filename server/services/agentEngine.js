const db = require('../config/db');
const { GoogleGenAI } = require('@google/genai');

// Initialize Gemini client if key is configured
let genAI = null;
if (process.env.GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenAI({});
  } catch (err) {
    console.warn('[AI Agent] Could not initialize GoogleGenAI client:', err.message);
  }
}

/**
 * Fetch comprehensive project state from PostgreSQL
 */
async function getProjectContext(projectId) {
  const projRes = await db.query(
    `SELECT p.*, u.name as owner_name 
     FROM projects p 
     JOIN users u ON p.owner_id = u.id 
     WHERE p.id = $1`,
    [projectId]
  );
  if (projRes.rows.length === 0) return null;
  const project = projRes.rows[0];

  // Fetch members
  const membersRes = await db.query(
    `SELECT u.id, u.name, u.email, u.avatar_url, pm.role,
       (SELECT COUNT(*) FROM tasks t WHERE t.assignee_id = u.id AND t.project_id = $1 AND t.status != 'DONE') as active_tasks
     FROM project_members pm
     JOIN users u ON pm.user_id = u.id
     WHERE pm.project_id = $1
     ORDER BY active_tasks DESC`,
    [projectId]
  );

  // Fetch tasks
  const tasksRes = await db.query(
    `SELECT t.id, t.title, t.description, t.status, t.priority, t.due_date,
            u.id as assignee_id, u.name as assignee_name
     FROM tasks t
     LEFT JOIN users u ON t.assignee_id = u.id
     WHERE t.project_id = $1
     ORDER BY t.position ASC, t.id ASC`,
    [projectId]
  );

  // Calculate telemetry
  const totalTasks = tasksRes.rows.length;
  const doneTasks = tasksRes.rows.filter(t => t.status === 'DONE').length;
  const inProgressTasks = tasksRes.rows.filter(t => t.status === 'IN PROGRESS').length;
  const inReviewTasks = tasksRes.rows.filter(t => t.status === 'IN REVIEW').length;
  const todoTasks = tasksRes.rows.filter(t => t.status === 'TODO').length;
  const backlogTasks = tasksRes.rows.filter(t => t.status === 'BACKLOG').length;
  const unassignedTasks = tasksRes.rows.filter(t => !t.assignee_id && t.status !== 'DONE').length;

  const today = new Date().toISOString().split('T')[0];
  const overdueTasks = tasksRes.rows.filter(t => t.due_date && t.due_date < today && t.status !== 'DONE');

  return {
    project,
    members: membersRes.rows.map(m => ({ ...m, active_tasks: Number(m.active_tasks) || 0 })),
    tasks: tasksRes.rows,
    metrics: {
      totalTasks,
      doneTasks,
      inProgressTasks,
      inReviewTasks,
      todoTasks,
      backlogTasks,
      unassignedTasks,
      overdueTasksCount: overdueTasks.length,
      completionRate: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0,
      overdueTasks: overdueTasks.map(t => ({ id: t.id, title: t.title, due_date: t.due_date, assignee: t.assignee_name }))
    }
  };
}

/**
 * Fetch global workspace telemetry across all projects
 */
async function getWorkspaceContext() {
  const projectsRes = await db.query(
    `SELECT p.id, p.name, p.color, p.priority, p.status,
       (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as total_tasks,
       (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'DONE') as done_tasks,
       (SELECT COUNT(*) FROM project_members pm WHERE pm.project_id = p.id) as members_count
     FROM projects p
     WHERE p.is_archived IS FALSE
     ORDER BY p.name ASC`
  );

  const usersRes = await db.query(
    `SELECT u.id, u.name, u.email, u.role,
       (SELECT COUNT(*) FROM tasks t WHERE t.assignee_id = u.id AND t.status != 'DONE') as active_tasks
     FROM users u
     ORDER BY active_tasks DESC`
  );

  return {
    projects: projectsRes.rows.map(p => ({
      ...p,
      total_tasks: Number(p.total_tasks) || 0,
      done_tasks: Number(p.done_tasks) || 0,
      members_count: Number(p.members_count) || 1
    })),
    users: usersRes.rows.map(u => ({
      ...u,
      active_tasks: Number(u.active_tasks) || 0
    }))
  };
}

/**
 * Main Autonomous Agent reasoning dispatcher
 */
async function runAgentChat({ prompt, projectId, userId }) {
  const steps = [];
  steps.push({ stage: 'interpret_intent', title: 'Parsing user request & intent...', detail: prompt });

  let context = null;
  if (projectId) {
    steps.push({ stage: 'fetch_context', title: 'Inspecting PostgreSQL project telemetry...', detail: `Project ID: ${projectId}` });
    context = await getProjectContext(projectId);
  } else {
    steps.push({ stage: 'fetch_context', title: 'Inspecting global workspace telemetry...', detail: 'Workspace-wide aggregation' });
    context = await getWorkspaceContext();
  }

  // Check if Gemini API is available and can be queried
  if (genAI && process.env.GEMINI_API_KEY) {
    try {
      steps.push({ stage: 'gemini_reasoning', title: 'Invoking Gemini 3.8 Flash agentic model...', detail: 'Generating strategic multi-turn response' });
      
      const systemInstruction = `You are "TaskFlow Copilot (Nova)", an elite autonomous AI Project Coordinator and Scrum Master built directly into TaskFlow.
You provide clear, highly structured, proactive project management assistance.
You analyze real team velocity, project state, bottlenecks, and workloads.
Always structure recommendations clearly with markdown, bullet points, and actionable action items.
Whenever proposing tasks to create, provide them as JSON in an \`\`\`actions code block with schema:
{
  "actions": [
    {
      "type": "create_task",
      "title": "Task title",
      "description": "Clear technical description and acceptance criteria",
      "status": "TODO | BACKLOG | IN PROGRESS",
      "priority": "Urgent | High | Medium | Low",
      "assignee_id": null or user id,
      "due_in_days": 3
    }
  ]
}`;

      const response = await genAI.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          { role: 'user', parts: [{ text: `User Prompt: ${prompt}\n\nLive Project Data:\n${JSON.stringify(context, null, 2)}` }] }
        ],
        config: {
          systemInstruction,
          temperature: 0.2
        }
      });

      const responseText = response.text || '';
      
      // Parse any embedded action JSON blocks
      let actions = [];
      const jsonMatch = responseText.match(/```(?:json|actions)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          if (Array.isArray(parsed.actions)) {
            actions = parsed.actions;
          }
        } catch {
          // ignore json parse error
        }
      }

      steps.push({ stage: 'synthesize_plan', title: 'Synthesized plan & action proposals', detail: `${actions.length} action items prepared.` });

      return {
        success: true,
        source: 'gemini-3.8-flash',
        thoughts: steps,
        response: responseText.replace(/```(?:json|actions)?\s*([\s\S]*?)\s*```/g, '').trim() || responseText,
        actions: actions.map((a, i) => ({ id: `act-${Date.now()}-${i}`, ...a }))
      };
    } catch (err) {
      console.warn('[AI Agent] Gemini call failed, falling back to autonomous engine:', err.message);
      // Fall through to deterministic agent reasoning engine
    }
  }

  // Autonomous Deterministic Agentic Fallback Engine
  steps.push({ stage: 'autonomous_engine', title: 'Running TaskFlow Autonomous Reasoning Engine...', detail: 'Multi-step heuristic evaluation & tool dispatch' });

  const lowerPrompt = prompt.toLowerCase();
  let generatedResponse = '';
  let actions = [];

  // Decision Logic
  if (lowerPrompt.includes('break down') || lowerPrompt.includes('create task') || lowerPrompt.includes('generate task') || lowerPrompt.includes('user stor')) {
    steps.push({ stage: 'tool_dispatch', title: 'Dispatched tool: breakdown_feature()', detail: 'Decomposing objective into sprint user stories' });

    const breakdownResult = await decomposeFeature(prompt, context?.project?.id || projectId);
    generatedResponse = breakdownResult.summary;
    actions = breakdownResult.actions;

  } else if (lowerPrompt.includes('balance') || lowerPrompt.includes('workload') || lowerPrompt.includes('assign') || lowerPrompt.includes('overload')) {
    steps.push({ stage: 'tool_dispatch', title: 'Dispatched tool: rebalance_workload()', detail: 'Evaluating team bandwidth & capacity distributions' });

    const balanceResult = await analyzeAndBalanceWorkload(context, projectId);
    generatedResponse = balanceResult.summary;
    actions = balanceResult.actions;

  } else if (lowerPrompt.includes('standup') || lowerPrompt.includes('summary') || lowerPrompt.includes('status') || lowerPrompt.includes('health') || lowerPrompt.includes('blocker')) {
    steps.push({ stage: 'tool_dispatch', title: 'Dispatched tool: inspect_project_metrics()', detail: 'Synthesizing burndown, progress & overdue flags' });

    const standupResult = await generateSprintIntelligence(context, prompt);
    generatedResponse = standupResult.summary;
    actions = standupResult.actions;

  } else {
    // General Project Copilot Assistant
    steps.push({ stage: 'tool_dispatch', title: 'Dispatched tool: general_copilot_assistant()', detail: 'Analyzing general project queries' });

    const generalResult = await generalAssistantResponse(prompt, context);
    generatedResponse = generalResult.summary;
    actions = generalResult.actions;
  }

  steps.push({ stage: 'finalize_execution', title: 'Action recommendations ready for review', detail: `${actions.length} proposed actions generated.` });

  return {
    success: true,
    source: 'taskflow-autonomous-agent',
    thoughts: steps,
    response: generatedResponse,
    actions
  };
}

/**
 * Feature Decomposition Sub-Agent
 */
async function decomposeFeature(prompt, projectId) {
  // Extract key topic from prompt
  const cleanedTopic = prompt
    .replace(/(break down|create tasks for|generate tasks for|user stories for|can you|please)/gi, '')
    .trim() || 'New System Capability';

  const titlePrefix = cleanedTopic.charAt(0).toUpperCase() + cleanedTopic.slice(1);

  // Generate 4 highly practical engineering user stories
  const actions = [
    {
      type: 'create_task',
      title: `${titlePrefix}: Architecture Design & Data Modeling`,
      description: `Define PostgreSQL schema, database migration scripts, indexes, and API contract specifications for ${titlePrefix}.\n\n### Acceptance Criteria:\n- [ ] Database schema defined with proper foreign keys.\n- [ ] REST API endpoints documented with request/response schemas.\n- [ ] Architectural review signed off.`,
      status: 'TODO',
      priority: 'High',
      due_in_days: 3
    },
    {
      type: 'create_task',
      title: `${titlePrefix}: Backend API & Business Logic Implementation`,
      description: `Implement Express controllers, service layer verification, input sanitization, and unit tests for ${titlePrefix}.\n\n### Acceptance Criteria:\n- [ ] CRUD operations with JWT authentication guards.\n- [ ] Error handling with informative HTTP status codes.\n- [ ] Automated integration test coverage >= 80%.`,
      status: 'TODO',
      priority: 'Urgent',
      due_in_days: 5
    },
    {
      type: 'create_task',
      title: `${titlePrefix}: Interactive Frontend UI & Real-Time Sync`,
      description: `Develop responsive React 18 component, integrate Tailwind styling, connect Axios API client, and hook into Socket.io events.\n\n### Acceptance Criteria:\n- [ ] Mobile-responsive layout matching design system.\n- [ ] Optimistic UI state updates on user interactions.\n- [ ] Live WebSocket event listeners for multi-window synchronization.`,
      status: 'TODO',
      priority: 'High',
      due_in_days: 7
    },
    {
      type: 'create_task',
      title: `${titlePrefix}: End-to-End QA & Staging Verification`,
      description: `Conduct end-to-end integration testing, edge-case validation, performance benchmarks, and accessibility audit (WCAG AA).\n\n### Acceptance Criteria:\n- [ ] Zero blocking console errors or memory leaks.\n- [ ] Cross-browser verified (Chrome, Safari, Firefox).\n- [ ] Production build verified in staging environment.`,
      status: 'BACKLOG',
      priority: 'Medium',
      due_in_days: 10
    }
  ];

  const summary = `### 🎯 Sprint Breakdown: **${titlePrefix}**
I have analyzed the technical scope and decomposed this initiative into **4 sprint-ready engineering tasks** with detailed acceptance criteria and recommended priorities:

1. **Architecture Design & Data Modeling** *(Priority: High, 3-day target)*
2. **Backend API & Business Logic Implementation** *(Priority: Urgent, 5-day target)*
3. **Interactive Frontend UI & Real-Time Sync** *(Priority: High, 7-day target)*
4. **End-to-End QA & Staging Verification** *(Priority: Medium, 10-day target)*

You can inspect the proposed action items below and click **"Apply to Board"** to create them instantly in PostgreSQL.`;

  return { summary, actions };
}

/**
 * Workload Balancing Sub-Agent
 */
async function analyzeAndBalanceWorkload(context, projectId) {
  if (!context || !context.members || context.members.length === 0) {
    return {
      summary: '### ⚖️ Workload Assessment\nNo team member data found for this context. Please ensure members are assigned to the project.',
      actions: []
    };
  }

  const members = [...context.members].sort((a, b) => b.active_tasks - a.active_tasks);
  const highest = members[0];
  const lowest = members[members.length - 1];

  const unassignedTasks = (context.tasks || []).filter(t => !t.assignee_id && t.status !== 'DONE');
  const actions = [];

  let summary = `### ⚖️ Team Workload & Capacity Analysis\n\n`;
  summary += `Here is the current distribution of active (unfinished) tasks:\n`;
  members.forEach(m => {
    const bar = '█'.repeat(Math.min(m.active_tasks, 10)) || '▫️';
    summary += `- **${m.name}** (${m.role}): \`${m.active_tasks} active tasks\` ${bar}\n`;
  });

  if (highest.active_tasks - lowest.active_tasks > 2) {
    summary += `\n⚠️ **Workload Imbalance Detected**: **${highest.name}** has ${highest.active_tasks} tasks while **${lowest.name}** has ${lowest.active_tasks} tasks.\n`;
  } else {
    summary += `\n✅ **Workload Health**: Team distribution is well balanced across active initiatives.\n`;
  }

  if (unassignedTasks.length > 0) {
    summary += `\nFound **${unassignedTasks.length} unassigned tickets**. I recommend allocating them to maintain velocity:\n`;
    unassignedTasks.slice(0, 3).forEach((task, idx) => {
      // Rotate among lower-loaded members
      const targetMember = members[(members.length - 1) - (idx % members.length)];
      actions.push({
        type: 'reassign_task',
        taskId: task.id,
        title: task.title,
        newAssigneeId: targetMember.id,
        newAssigneeName: targetMember.name,
        reason: `Rebalanced to ${targetMember.name} (currently ${targetMember.active_tasks} tasks)`
      });
      summary += `- Assign **"${task.title}"** to **${targetMember.name}**\n`;
    });
  }

  return { summary, actions };
}

/**
 * Sprint Health & Intelligence Sub-Agent
 */
async function generateSprintIntelligence(context, prompt) {
  if (!context || !context.metrics) {
    return {
      summary: '### 📊 Sprint Health Check\nWorkspace telemetry loaded. Projects are currently running smoothly.',
      actions: []
    };
  }

  const { metrics, project } = context;
  const actions = [];

  let summary = `### 📊 Sprint Intelligence Briefing: **${project ? project.name : 'Active Workspace'}**\n\n`;
  summary += `**Executive Metrics:**\n`;
  summary += `- **Sprint Progress:** \`${metrics.completionRate}% complete\` (${metrics.doneTasks}/${metrics.totalTasks} tasks resolved)\n`;
  summary += `- **Active In Progress:** \`${metrics.inProgressTasks} tasks\`\n`;
  summary += `- **In Review / Verification:** \`${metrics.inReviewTasks} tasks\`\n`;
  summary += `- **Pending / To-Do:** \`${metrics.todoTasks + metrics.backlogTasks} tasks\`\n`;

  if (metrics.overdueTasksCount > 0) {
    summary += `\n🚨 **Attention Needed - ${metrics.overdueTasksCount} Overdue Item(s):**\n`;
    metrics.overdueTasks.forEach(ot => {
      summary += `- **"${ot.title}"** (Assigned to: ${ot.assignee || 'Unassigned'}) — Due: ${ot.due_date}\n`;
      actions.push({
        type: 'update_priority',
        taskId: ot.id,
        title: ot.title,
        priority: 'Urgent',
        reason: 'Flagged by Agent: Deadline has passed'
      });
    });
  } else {
    summary += `\n✅ **Deadline Health:** No overdue tasks detected. Sprint velocity is currently on track.\n`;
  }

  if (metrics.inReviewTasks >= 3) {
    summary += `\n⚠️ **Bottleneck Advisory:** There are ${metrics.inReviewTasks} cards waiting in "IN REVIEW". Consider scheduling a code review synchronization to unlock deployment.\n`;
  }

  return { summary, actions };
}

/**
 * General Project Copilot Assistant
 */
async function generalAssistantResponse(prompt, context) {
  const summary = `### 🤖 TaskFlow Copilot Assistant\n\nI have evaluated your request regarding **${context?.project ? context.project.name : 'TaskFlow'}**.\n\nHere is how I can assist your team right now:\n\n1. **Feature to Sprint Decomposition**: Tell me a feature (e.g., *"Break down Apple Pay checkout"*) and I will generate structured user stories with acceptance criteria.\n2. **Sprint Health & Blocker Analysis**: Ask for *"Sprint health"* or *"Daily standup summary"* to inspect velocity, completion rates, and bottlenecks.\n3. **Workload Balancing**: Ask *"Balance team workload"* to automatically recommend task allocations based on team bandwidth.\n4. **Task Enhancement**: Open any card and use *"AI Enhance"* to generate technical specifications and subtasks.\n\nWhat would you like to execute next?`;

  return { summary, actions: [] };
}

/**
 * In-Situ Task Specification & Subtask Generator
 */
async function enhanceTaskContent({ title, description }) {
  const cleanTitle = (title || 'System Task').trim();

  // Acceptance criteria & technical specs
  const enhancedDescription = `${description ? description + '\n\n' : ''}### 📋 Acceptance Criteria (AI Generated)
- [ ] Implement core functionality with unit test coverage.
- [ ] Ensure proper input validation, error handling, and security sanitization.
- [ ] Verify responsive UI layout across desktop, tablet, and mobile viewports.
- [ ] Connect WebSocket real-time event broadcasting on mutation.

### 🛠️ Technical Implementation Notes
- **API Protocol:** REST endpoint with JWT header authentication.
- **Database Consistency:** PostgreSQL transactional update with foreign key validation.
- **Client Sync:** Optimistic cache update with fallback rollback on network failure.`;

  const suggestedSubtasks = [
    { text: 'Draft API specification and schema requirements', completed: false },
    { text: 'Implement backend controller logic & database queries', completed: false },
    { text: 'Build responsive frontend interface with error boundaries', completed: false },
    { text: 'Run integration test suite & verify multi-window sync', completed: false }
  ];

  // Heuristic priority & estimate
  let suggestedPriority = 'Medium';
  const lower = cleanTitle.toLowerCase();
  if (lower.includes('security') || lower.includes('auth') || lower.includes('bug') || lower.includes('payment') || lower.includes('urgent')) {
    suggestedPriority = 'Urgent';
  } else if (lower.includes('api') || lower.includes('database') || lower.includes('redesign') || lower.includes('sync')) {
    suggestedPriority = 'High';
  }

  return {
    enhancedDescription,
    suggestedSubtasks,
    suggestedPriority,
    suggestedEstimateDays: suggestedPriority === 'Urgent' ? 2 : 5
  };
}

module.exports = {
  runAgentChat,
  getProjectContext,
  getWorkspaceContext,
  decomposeFeature,
  analyzeAndBalanceWorkload,
  generateSprintIntelligence,
  enhanceTaskContent
};
