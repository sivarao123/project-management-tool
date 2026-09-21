const db = require('../config/db');
const { logActivity } = require('../utils/activity');
const { createNotification } = require('../utils/notification');
const { emitGlobal } = require('../socket');

// Get all projects for current user (owned or member)
exports.getProjects = async (req, res) => {
  try {
    const userId = req.user.id;
    const includeArchived = req.query.archived === 'true';

    const queryStr = `
      SELECT 
        p.*,
        u.name as owner_name,
        u.avatar_url as owner_avatar,
        COALESCE(pm.role, CASE WHEN p.owner_id = $1 THEN 'Owner' ELSE 'Viewer' END) as user_role,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as total_tasks,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'DONE') as completed_tasks,
        (SELECT COUNT(*) FROM project_members mem WHERE mem.project_id = p.id) as member_count
      FROM projects p
      JOIN users u ON p.owner_id = u.id
      LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = $1
      WHERE (p.owner_id = $1 OR pm.user_id = $1)
        ${includeArchived ? '' : 'AND (p.is_archived IS FALSE)'}
      ORDER BY p.updated_at DESC
    `;

    const result = await db.query(queryStr, [userId]);

    // Format metrics
    const projects = result.rows.map(p => {
      const total = Number(p.total_tasks) || 0;
      const completed = Number(p.completed_tasks) || 0;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
      return {
        ...p,
        total_tasks: total,
        completed_tasks: completed,
        member_count: Number(p.member_count) || 1,
        progress
      };
    });

    return res.json({ success: true, projects });
  } catch (err) {
    console.error('getProjects error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch projects.' });
  }
};

// Get single project by ID with members & labels
exports.getProjectById = async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.user.id;

    const projRes = await db.query(
      `SELECT p.*, u.name as owner_name, u.avatar_url as owner_avatar
       FROM projects p
       JOIN users u ON p.owner_id = u.id
       WHERE p.id = $1`,
      [projectId]
    );

    if (projRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const project = projRes.rows[0];

    // Fetch members
    const membersRes = await db.query(
      `SELECT pm.id as member_id, pm.role, pm.joined_at, u.id as user_id, u.name, u.email, u.avatar_url
       FROM project_members pm
       JOIN users u ON pm.user_id = u.id
       WHERE pm.project_id = $1
       ORDER BY pm.joined_at ASC`,
      [projectId]
    );

    // Fetch labels
    const labelsRes = await db.query(
      'SELECT id, name, color FROM labels WHERE project_id = $1 ORDER BY id ASC',
      [projectId]
    );

    // User's role in this project
    const myRoleRes = await db.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );
    const userRole = myRoleRes.rows[0]?.role || (project.owner_id === userId ? 'Owner' : 'Viewer');

    // Tasks summary stats
    const statsRes = await db.query(
      `SELECT 
         COUNT(*) as total,
         COUNT(CASE WHEN status = 'DONE' THEN 1 END) as completed,
         COUNT(CASE WHEN status = 'IN PROGRESS' THEN 1 END) as in_progress,
         COUNT(CASE WHEN status = 'TODO' THEN 1 END) as todo,
         COUNT(CASE WHEN status = 'BACKLOG' THEN 1 END) as backlog,
         COUNT(CASE WHEN status = 'IN REVIEW' THEN 1 END) as in_review,
         COUNT(CASE WHEN due_date < CURRENT_DATE AND status != 'DONE' THEN 1 END) as overdue
       FROM tasks WHERE project_id = $1`,
      [projectId]
    );

    const stats = statsRes.rows[0] || {};
    const total = Number(stats.total) || 0;
    const completed = Number(stats.completed) || 0;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    return res.json({
      success: true,
      project: {
        ...project,
        user_role: userRole,
        members: membersRes.rows,
        labels: labelsRes.rows,
        stats: {
          total,
          completed,
          in_progress: Number(stats.in_progress) || 0,
          todo: Number(stats.todo) || 0,
          backlog: Number(stats.backlog) || 0,
          in_review: Number(stats.in_review) || 0,
          overdue: Number(stats.overdue) || 0,
          progress
        }
      }
    });
  } catch (err) {
    console.error('getProjectById error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch project details.' });
  }
};

// Create new project
exports.createProject = async (req, res) => {
  try {
    const { name, description, color, priority, start_date, due_date, members } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Project name is required.' });
    }

    const userId = req.user.id;

    const projRes = await db.query(
      `INSERT INTO projects (name, description, color, priority, start_date, due_date, status, is_archived, owner_id)
       VALUES ($1, $2, $3, $4, $5, $6, 'Active', FALSE, $7) RETURNING *`,
      [
        name.trim(),
        description || '',
        color || '#4F46E5',
        priority || 'Medium',
        start_date || new Date().toISOString().split('T')[0],
        due_date || null,
        userId
      ]
    );

    const newProject = projRes.rows[0];

    // Add creator as Owner in project_members
    await db.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
      [newProject.id, userId, 'Owner']
    );

    // Create default labels for project
    const defaultLabels = [
      { name: 'Frontend', color: '#3B82F6' },
      { name: 'Backend', color: '#10B981' },
      { name: 'UI/UX', color: '#EC4899' },
      { name: 'Bug', color: '#EF4444' },
      { name: 'DevOps', color: '#8B5CF6' }
    ];

    for (const lbl of defaultLabels) {
      await db.query('INSERT INTO labels (project_id, name, color) VALUES ($1, $2, $3)', [newProject.id, lbl.name, lbl.color]);
    }

    // Add any specified initial members
    if (Array.isArray(members)) {
      for (const m of members) {
        if (m.userId && m.userId !== userId) {
          await db.query(
            'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
            [newProject.id, m.userId, m.role || 'Member']
          );
          await createNotification(
            m.userId,
            userId,
            'project_invite',
            'Project Invitation',
            `${req.user.name} added you to project "${newProject.name}"`,
            `/projects/${newProject.id}`
          );
        }
      }
    }

    // Log Activity
    await logActivity(newProject.id, userId, 'created_project', 'project', newProject.id, {
      name: newProject.name
    });

    emitGlobal('project:created', newProject);

    return res.status(201).json({
      success: true,
      message: 'Project created successfully.',
      project: newProject
    });
  } catch (err) {
    console.error('createProject error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create project.' });
  }
};

// Update project
exports.updateProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const { name, description, color, priority, start_date, due_date, status } = req.body;

    const updates = [];
    const values = [];
    let idx = 1;

    if (name !== undefined) {
      updates.push(`name = $${idx++}`);
      values.push(name.trim());
    }
    if (description !== undefined) {
      updates.push(`description = $${idx++}`);
      values.push(description);
    }
    if (color !== undefined) {
      updates.push(`color = $${idx++}`);
      values.push(color);
    }
    if (priority !== undefined) {
      updates.push(`priority = $${idx++}`);
      values.push(priority);
    }
    if (start_date !== undefined) {
      updates.push(`start_date = $${idx++}`);
      values.push(start_date || null);
    }
    if (due_date !== undefined) {
      updates.push(`due_date = $${idx++}`);
      values.push(due_date || null);
    }
    if (status !== undefined) {
      updates.push(`status = $${idx++}`);
      values.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update.' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(projectId);

    const queryStr = `UPDATE projects SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`;
    const result = await db.query(queryStr, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const updated = result.rows[0];

    await logActivity(projectId, req.user.id, 'updated_project', 'project', projectId, {
      name: updated.name
    });

    emitGlobal('project:updated', updated);

    return res.json({
      success: true,
      message: 'Project updated successfully.',
      project: updated
    });
  } catch (err) {
    console.error('updateProject error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update project.' });
  }
};

// Archive project
exports.archiveProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const result = await db.query(
      'UPDATE projects SET is_archived = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [projectId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }
    await logActivity(projectId, req.user.id, 'archived_project', 'project', projectId, {
      name: result.rows[0].name
    });
    return res.json({ success: true, message: 'Project archived.', project: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to archive project.' });
  }
};

// Restore project
exports.restoreProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const result = await db.query(
      'UPDATE projects SET is_archived = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [projectId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }
    await logActivity(projectId, req.user.id, 'restored_project', 'project', projectId, {
      name: result.rows[0].name
    });
    return res.json({ success: true, message: 'Project restored.', project: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to restore project.' });
  }
};

// Delete project
exports.deleteProject = async (req, res) => {
  try {
    const projectId = req.params.id;

    // Check ownership
    const proj = await db.query('SELECT owner_id, name FROM projects WHERE id = $1', [projectId]);
    if (proj.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    if (proj.rows[0].owner_id !== req.user.id && req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Only the project owner can delete this project.' });
    }

    await db.query('DELETE FROM projects WHERE id = $1', [projectId]);

    emitGlobal('project:deleted', { projectId });

    return res.json({ success: true, message: 'Project deleted successfully.' });
  } catch (err) {
    console.error('deleteProject error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete project.' });
  }
};
