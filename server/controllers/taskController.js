const db = require('../config/db');
const { logActivity } = require('../utils/activity');
const { createNotification } = require('../utils/notification');
const { emitToProject } = require('../socket');

// Helper to fetch task with all relations (assignee, creator, labels, counts)
async function fetchEnrichedTask(taskId) {
  const taskRes = await db.query(
    `SELECT 
       t.*,
       p.name as project_name,
       p.color as project_color,
       u.name as assignee_name,
       u.avatar_url as assignee_avatar,
       u.email as assignee_email,
       c.name as creator_name,
       c.avatar_url as creator_avatar,
       (SELECT COUNT(*) FROM comments cm WHERE cm.task_id = t.id) as comments_count,
       (SELECT COUNT(*) FROM attachments at WHERE at.task_id = t.id) as attachments_count
     FROM tasks t
     JOIN projects p ON t.project_id = p.id
     LEFT JOIN users u ON t.assignee_id = u.id
     LEFT JOIN users c ON t.creator_id = c.id
     WHERE t.id = $1`,
    [taskId]
  );

  if (taskRes.rows.length === 0) return null;
  const task = taskRes.rows[0];

  // Fetch labels
  const labelsRes = await db.query(
    `SELECT l.id, l.name, l.color
     FROM labels l
     JOIN task_labels tl ON l.id = tl.label_id
     WHERE tl.task_id = $1`,
    [taskId]
  );
  task.labels = labelsRes.rows;
  task.comments_count = Number(task.comments_count) || 0;
  task.attachments_count = Number(task.attachments_count) || 0;

  return task;
}

// Get all tasks for a project
exports.getProjectTasks = async (req, res) => {
  try {
    const projectId = req.params.projectId || req.params.id;

    const tasksRes = await db.query(
      `SELECT 
         t.*,
         p.name as project_name,
         p.color as project_color,
         u.name as assignee_name,
         u.avatar_url as assignee_avatar,
         u.email as assignee_email,
         c.name as creator_name,
         c.avatar_url as creator_avatar,
         (SELECT COUNT(*) FROM comments cm WHERE cm.task_id = t.id) as comments_count,
         (SELECT COUNT(*) FROM attachments at WHERE at.task_id = t.id) as attachments_count
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       LEFT JOIN users u ON t.assignee_id = u.id
       LEFT JOIN users c ON t.creator_id = c.id
       WHERE t.project_id = $1
       ORDER BY t.position ASC, t.id ASC`,
      [projectId]
    );

    // Fetch all labels for these tasks
    const labelsRes = await db.query(
      `SELECT tl.task_id, l.id, l.name, l.color
       FROM task_labels tl
       JOIN labels l ON tl.label_id = l.id
       WHERE l.project_id = $1`,
      [projectId]
    );

    const labelsMap = new Map();
    for (const row of labelsRes.rows) {
      if (!labelsMap.has(row.task_id)) {
        labelsMap.set(row.task_id, []);
      }
      labelsMap.get(row.task_id).push({
        id: row.id,
        name: row.name,
        color: row.color
      });
    }

    const tasks = tasksRes.rows.map(t => ({
      ...t,
      comments_count: Number(t.comments_count) || 0,
      attachments_count: Number(t.attachments_count) || 0,
      labels: labelsMap.get(t.id) || []
    }));

    return res.json({ success: true, tasks });
  } catch (err) {
    console.error('getProjectTasks error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch tasks.' });
  }
};

// Get single task details
exports.getTaskById = async (req, res) => {
  try {
    const taskId = req.params.id;
    const task = await fetchEnrichedTask(taskId);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    // Fetch attachments
    const attachRes = await db.query(
      `SELECT a.*, u.name as uploader_name, u.avatar_url as uploader_avatar
       FROM attachments a
       LEFT JOIN users u ON a.uploader_id = u.id
       WHERE a.task_id = $1
       ORDER BY a.created_at DESC`,
      [taskId]
    );
    task.attachments = attachRes.rows;

    // Fetch comments
    const commentsRes = await db.query(
      `SELECT c.*, u.name as author_name, u.avatar_url as author_avatar, u.email as author_email
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.task_id = $1
       ORDER BY c.created_at ASC`,
      [taskId]
    );
    task.comments = commentsRes.rows;

    // Fetch task-related activities
    const actRes = await db.query(
      `SELECT a.*, u.name as user_name, u.avatar_url as user_avatar
       FROM activity_logs a
       LEFT JOIN users u ON a.user_id = u.id
       WHERE a.entity_id = $1 AND a.entity_type = 'task'
       ORDER BY a.created_at DESC
       LIMIT 15`,
      [taskId]
    );
    task.activities = actRes.rows;

    return res.json({ success: true, task });
  } catch (err) {
    console.error('getTaskById error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch task details.' });
  }
};

// Create task
exports.createTask = async (req, res) => {
  try {
    const projectId = req.params.projectId || req.body.project_id;
    const { title, description, status, priority, due_date, assignee_id, label_ids } = req.body;
    const userId = req.user.id;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Task title is required.' });
    }

    const taskStatus = status || 'TODO';
    const taskPriority = priority || 'Medium';

    // Get maximum position in current column
    const posRes = await db.query(
      'SELECT COALESCE(MAX(position), -1) + 1 as next_pos FROM tasks WHERE project_id = $1 AND status = $2',
      [projectId, taskStatus]
    );
    const position = posRes.rows[0].next_pos || 0;

    const insertRes = await db.query(
      `INSERT INTO tasks (project_id, title, description, status, priority, position, assignee_id, creator_id, due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [
        projectId,
        title.trim(),
        description || '',
        taskStatus,
        taskPriority,
        position,
        assignee_id || null,
        userId,
        due_date || null
      ]
    );

    const taskId = insertRes.rows[0].id;

    // Attach labels if provided
    if (Array.isArray(label_ids) && label_ids.length > 0) {
      for (const lblId of label_ids) {
        await db.query('INSERT INTO task_labels (task_id, label_id) VALUES ($1, $2)', [taskId, lblId]);
      }
    }

    const enrichedTask = await fetchEnrichedTask(taskId);

    // Log activity
    await logActivity(projectId, userId, 'created_task', 'task', taskId, {
      title: enrichedTask.title,
      status: taskStatus
    });

    // Notify assignee if assigned to someone else
    if (assignee_id && assignee_id !== userId) {
      await createNotification(
        assignee_id,
        userId,
        'task_assigned',
        'Task Assigned',
        `${req.user.name} assigned you to "${title}"`,
        `/projects/${projectId}?task=${taskId}`
      );
    }

    // Real-time broadcast
    emitToProject(projectId, 'task:created', enrichedTask);

    return res.status(201).json({
      success: true,
      message: 'Task created successfully.',
      task: enrichedTask
    });
  } catch (err) {
    console.error('createTask error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create task.' });
  }
};

// Update task
exports.updateTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const { title, description, status, priority, due_date, assignee_id, position, label_ids } = req.body;
    const userId = req.user.id;

    // Get current task
    const oldTaskRes = await db.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
    if (oldTaskRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }
    const oldTask = oldTaskRes.rows[0];
    const projectId = oldTask.project_id;

    const updates = [];
    const values = [];
    let idx = 1;

    if (title !== undefined) {
      updates.push(`title = $${idx++}`);
      values.push(title.trim());
    }
    if (description !== undefined) {
      updates.push(`description = $${idx++}`);
      values.push(description);
    }
    if (status !== undefined) {
      updates.push(`status = $${idx++}`);
      values.push(status);
    }
    if (priority !== undefined) {
      updates.push(`priority = $${idx++}`);
      values.push(priority);
    }
    if (due_date !== undefined) {
      updates.push(`due_date = $${idx++}`);
      values.push(due_date || null);
    }
    if (assignee_id !== undefined) {
      updates.push(`assignee_id = $${idx++}`);
      values.push(assignee_id || null);
    }
    if (position !== undefined) {
      updates.push(`position = $${idx++}`);
      values.push(position);
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(taskId);

      const queryStr = `UPDATE tasks SET ${updates.join(', ')} WHERE id = $${idx}`;
      await db.query(queryStr, values);
    }

    // Update labels if provided
    if (Array.isArray(label_ids)) {
      await db.query('DELETE FROM task_labels WHERE task_id = $1', [taskId]);
      for (const lblId of label_ids) {
        await db.query('INSERT INTO task_labels (task_id, label_id) VALUES ($1, $2)', [taskId, lblId]);
      }
    }

    const updatedTask = await fetchEnrichedTask(taskId);

    // Check status change activity
    if (status && status !== oldTask.status) {
      await logActivity(projectId, userId, 'moved_task', 'task', taskId, {
        title: updatedTask.title,
        from: oldTask.status,
        to: status
      });

      // If assignee is different, notify them about status change
      if (oldTask.assignee_id && oldTask.assignee_id !== userId) {
        await createNotification(
          oldTask.assignee_id,
          userId,
          'task_status',
          'Status Changed',
          `${req.user.name} moved "${updatedTask.title}" to ${status}`,
          `/projects/${projectId}?task=${taskId}`
        );
      }
    }

    // Check assignee change
    if (assignee_id !== undefined && assignee_id !== oldTask.assignee_id) {
      if (assignee_id && assignee_id !== userId) {
        await logActivity(projectId, userId, 'assigned_task', 'task', taskId, {
          title: updatedTask.title,
          assignee: updatedTask.assignee_name
        });
        await createNotification(
          assignee_id,
          userId,
          'task_assigned',
          'Task Assigned',
          `${req.user.name} assigned you to "${updatedTask.title}"`,
          `/projects/${projectId}?task=${taskId}`
        );
      }
    }

    // Real-time broadcast
    emitToProject(projectId, 'task:updated', updatedTask);

    return res.json({
      success: true,
      message: 'Task updated successfully.',
      task: updatedTask
    });
  } catch (err) {
    console.error('updateTask error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update task.' });
  }
};

// Reorder tasks during drag-and-drop
exports.reorderTasks = async (req, res) => {
  try {
    const { items } = req.body; // Array of { id, status, position }
    const projectId = req.params.projectId;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Items array is required.' });
    }

    for (const item of items) {
      await db.query(
        'UPDATE tasks SET status = $1, position = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
        [item.status, item.position, item.id]
      );
    }

    emitToProject(projectId, 'tasks:reordered', { items });

    return res.json({ success: true, message: 'Tasks reordered successfully.' });
  } catch (err) {
    console.error('reorderTasks error:', err);
    return res.status(500).json({ success: false, message: 'Failed to reorder tasks.' });
  }
};

// Delete task
exports.deleteTask = async (req, res) => {
  try {
    const taskId = req.params.id;

    const task = await db.query('SELECT project_id, title FROM tasks WHERE id = $1', [taskId]);
    if (task.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const { project_id, title } = task.rows[0];

    await db.query('DELETE FROM tasks WHERE id = $1', [taskId]);

    await logActivity(project_id, req.user.id, 'deleted_task', 'task', taskId, { title });

    emitToProject(project_id, 'task:deleted', { taskId: Number(taskId) });

    return res.json({ success: true, message: 'Task deleted successfully.' });
  } catch (err) {
    console.error('deleteTask error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete task.' });
  }
};

// Get aggregated tasks for current user across all projects
exports.getUserTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, priority, filter } = req.query;

    let filterClause = '';
    const params = [userId];

    if (filter === 'due_today') {
      filterClause += ' AND t.due_date = CURRENT_DATE';
    } else if (filter === 'overdue') {
      filterClause += " AND t.due_date < CURRENT_DATE AND t.status != 'DONE'";
    } else if (filter === 'completed') {
      filterClause += " AND t.status = 'DONE'";
    }

    if (status) {
      params.push(status);
      filterClause += ` AND t.status = $${params.length}`;
    }

    if (priority) {
      params.push(priority);
      filterClause += ` AND t.priority = $${params.length}`;
    }

    const tasksRes = await db.query(
      `SELECT 
         t.*,
         p.name as project_name,
         p.color as project_color,
         u.name as assignee_name,
         u.avatar_url as assignee_avatar,
         (SELECT COUNT(*) FROM comments cm WHERE cm.task_id = t.id) as comments_count,
         (SELECT COUNT(*) FROM attachments at WHERE at.task_id = t.id) as attachments_count
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       LEFT JOIN users u ON t.assignee_id = u.id
       WHERE t.assignee_id = $1
       ${filterClause}
       ORDER BY t.due_date ASC NULLS LAST, t.id DESC`,
      params
    );

    return res.json({
      success: true,
      tasks: tasksRes.rows.map(t => ({
        ...t,
        comments_count: Number(t.comments_count) || 0,
        attachments_count: Number(t.attachments_count) || 0
      }))
    });
  } catch (err) {
    console.error('getUserTasks error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch user tasks.' });
  }
};
