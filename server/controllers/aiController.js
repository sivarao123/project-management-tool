const db = require('../config/db');
const agentEngine = require('../services/agentEngine');
const { logActivity } = require('../utils/activity');
const { createNotification } = require('../utils/notification');
const { emitToProject, emitGlobal } = require('../socket');

// 1. Primary AI Agent Chat Endpoint
exports.agentChat = async (req, res) => {
  try {
    const { prompt, projectId } = req.body;
    const userId = req.user.id;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ success: false, message: 'Prompt cannot be empty.' });
    }

    const result = await agentEngine.runAgentChat({
      prompt: prompt.trim(),
      projectId: projectId ? Number(projectId) : null,
      userId
    });

    return res.json(result);
  } catch (err) {
    console.error('aiController.agentChat error:', err);
    return res.status(500).json({
      success: false,
      message: 'Agent processing encountered an error.',
      error: err.message
    });
  }
};

// 2. In-situ Feature Breakdown
exports.breakdownFeature = async (req, res) => {
  try {
    const { prompt, projectId } = req.body;
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ success: false, message: 'Feature prompt is required.' });
    }

    const result = await agentEngine.decomposeFeature(prompt.trim(), projectId ? Number(projectId) : null);
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('aiController.breakdownFeature error:', err);
    return res.status(500).json({ success: false, message: 'Failed to break down feature.', error: err.message });
  }
};

// 3. In-situ Task Specification & Subtask Enhancer
exports.enhanceTask = async (req, res) => {
  try {
    const { title, description } = req.body;
    const result = await agentEngine.enhanceTaskContent({ title, description });
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('aiController.enhanceTask error:', err);
    return res.status(500).json({ success: false, message: 'Failed to enhance task.', error: err.message });
  }
};

// 4. Standup & Sprint Health
exports.generateStandup = async (req, res) => {
  try {
    const { projectId } = req.body;
    let context = null;
    if (projectId) {
      context = await agentEngine.getProjectContext(Number(projectId));
    } else {
      context = await agentEngine.getWorkspaceContext();
    }

    const result = await agentEngine.generateSprintIntelligence(context, 'daily standup report');
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('aiController.generateStandup error:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate standup.', error: err.message });
  }
};

// 5. Execute Approved AI Actions into Database
exports.executeActions = async (req, res) => {
  try {
    const { actions, projectId } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(actions) || actions.length === 0) {
      return res.status(400).json({ success: false, message: 'No actions to execute.' });
    }

    const targetProjectId = Number(projectId);
    if (!targetProjectId) {
      return res.status(400).json({ success: false, message: 'Target project ID is required.' });
    }

    const results = [];
    const today = new Date();

    for (const act of actions) {
      if (act.type === 'create_task') {
        const dueOffset = act.due_in_days || 5;
        const dueDate = new Date(today.getTime() + dueOffset * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        // Get max position in column
        const posRes = await db.query(
          'SELECT COALESCE(MAX(position), -1) + 1 as next_pos FROM tasks WHERE project_id = $1 AND status = $2',
          [targetProjectId, act.status || 'TODO']
        );
        const position = Number(posRes.rows[0].next_pos) || 0;

        const insertRes = await db.query(
          `INSERT INTO tasks (project_id, title, description, status, priority, position, assignee_id, creator_id, due_date)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
          [
            targetProjectId,
            act.title,
            act.description || '',
            act.status || 'TODO',
            act.priority || 'Medium',
            position,
            act.assignee_id || null,
            userId,
            dueDate
          ]
        );

        const createdTask = insertRes.rows[0];

        // Enrich with basic relations
        createdTask.labels = [];
        createdTask.comments_count = 0;
        createdTask.attachments_count = 0;

        await logActivity(targetProjectId, userId, 'created_task', 'task', createdTask.id, {
          title: createdTask.title,
          source: 'TaskFlow AI Agent'
        });

        emitToProject(targetProjectId, 'task:created', createdTask);
        results.push({ action: 'create_task', taskId: createdTask.id, title: createdTask.title, status: 'success' });

      } else if (act.type === 'reassign_task' && act.taskId) {
        await db.query(
          'UPDATE tasks SET assignee_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [act.newAssigneeId, act.taskId]
        );

        const taskRes = await db.query('SELECT * FROM tasks WHERE id = $1', [act.taskId]);
        if (taskRes.rows.length > 0) {
          const updated = taskRes.rows[0];
          emitToProject(targetProjectId, 'task:updated', updated);

          await logActivity(targetProjectId, userId, 'assigned_task', 'task', act.taskId, {
            assigneeName: act.newAssigneeName,
            source: 'TaskFlow AI Agent'
          });

          results.push({ action: 'reassign_task', taskId: act.taskId, status: 'success' });
        }

      } else if (act.type === 'update_priority' && act.taskId) {
        await db.query(
          'UPDATE tasks SET priority = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [act.priority, act.taskId]
        );

        const taskRes = await db.query('SELECT * FROM tasks WHERE id = $1', [act.taskId]);
        if (taskRes.rows.length > 0) {
          const updated = taskRes.rows[0];
          emitToProject(targetProjectId, 'task:updated', updated);
          results.push({ action: 'update_priority', taskId: act.taskId, status: 'success' });
        }
      }
    }

    return res.json({
      success: true,
      message: `Successfully executed ${results.length} AI action(s).`,
      executedCount: results.length,
      results
    });
  } catch (err) {
    console.error('aiController.executeActions error:', err);
    return res.status(500).json({ success: false, message: 'Failed to execute AI actions.', error: err.message });
  }
};
