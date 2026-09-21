const db = require('../config/db');
const { logActivity } = require('../utils/activity');
const { createNotification } = require('../utils/notification');
const { emitGlobal } = require('../socket');

// Get all users in the system (for assigning, inviting, team page)
exports.getAllUsers = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, name, email, avatar_url, role, bio, created_at,
         (SELECT COUNT(*) FROM project_members pm WHERE pm.user_id = users.id) as project_count,
         (SELECT COUNT(*) FROM tasks t WHERE t.assignee_id = users.id AND t.status != 'DONE') as active_tasks_count
       FROM users
       ORDER BY name ASC`
    );

    // Fetch projects for each user
    const projectsRes = await db.query(
      `SELECT 
         pm.user_id,
         p.id as project_id,
         p.name as project_name,
         p.color as project_color,
         pm.role as member_role
       FROM project_members pm
       JOIN projects p ON pm.project_id = p.id
       WHERE p.is_archived IS FALSE
       ORDER BY p.name ASC`
    );

    const userProjectsMap = new Map();
    for (const row of projectsRes.rows) {
      if (!userProjectsMap.has(row.user_id)) {
        userProjectsMap.set(row.user_id, []);
      }
      userProjectsMap.get(row.user_id).push({
        id: row.project_id,
        name: row.project_name,
        color: row.project_color,
        role: row.member_role
      });
    }

    const users = result.rows.map(u => ({
      ...u,
      project_count: Number(u.project_count) || 0,
      active_tasks_count: Number(u.active_tasks_count) || 0,
      projects: userProjectsMap.get(u.id) || []
    }));

    return res.json({ success: true, users });
  } catch (err) {
    console.error('getAllUsers error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch users.' });
  }
};

// Assign user to a project from Team Page
exports.assignUserToProject = async (req, res) => {
  try {
    const { userId } = req.params;
    const { projectId, role = 'Member' } = req.body;
    const currentUserId = req.user.id;

    if (!projectId) {
      return res.status(400).json({ success: false, message: 'Project ID is required.' });
    }

    // Check project exists
    const projRes = await db.query('SELECT id, name, color, owner_id FROM projects WHERE id = $1', [projectId]);
    if (projRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }
    const project = projRes.rows[0];

    // Check if target user exists
    const targetUserRes = await db.query('SELECT id, name, email FROM users WHERE id = $1', [userId]);
    if (targetUserRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    const targetUser = targetUserRes.rows[0];

    // Check permission: current user must be owner or admin of the project
    const memberCheck = await db.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, currentUserId]
    );
    const isOwner = project.owner_id === currentUserId;
    const isAdmin = memberCheck.rows.length > 0 && ['Admin', 'Owner'].includes(memberCheck.rows[0].role);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Only project owners or admins can assign members to this project.' });
    }

    // Check if already a member
    const existing = await db.query(
      'SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: `${targetUser.name} is already a member of ${project.name}.` });
    }

    await db.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
      [projectId, userId, role]
    );

    // Log activity & notify
    await logActivity(projectId, currentUserId, 'added_member', 'user', userId, {
      userName: targetUser.name,
      role
    });

    await createNotification(
      userId,
      currentUserId,
      'project_invite',
      'Added to Project',
      `You were added to project "${project.name}" as ${role}`,
      `/projects/${projectId}`
    );

    // Global emit so any open team or project pages can update
    emitGlobal('team:member_assigned', {
      userId: Number(userId),
      project: {
        id: project.id,
        name: project.name,
        color: project.color,
        role
      }
    });

    // Fetch updated user projects
    const updatedProjectsRes = await db.query(
      `SELECT p.id, p.name, p.color, pm.role
       FROM project_members pm
       JOIN projects p ON pm.project_id = p.id
       WHERE pm.user_id = $1 AND p.is_archived IS FALSE
       ORDER BY p.name ASC`,
      [userId]
    );

    return res.json({
      success: true,
      message: `Successfully added ${targetUser.name} to ${project.name}`,
      projects: updatedProjectsRes.rows
    });
  } catch (err) {
    console.error('assignUserToProject error:', err);
    return res.status(500).json({ success: false, message: 'Failed to assign project.' });
  }
};

// Remove user from a project from Team Page
exports.removeUserFromProject = async (req, res) => {
  try {
    const { userId, projectId } = req.params;
    const currentUserId = req.user.id;

    const projRes = await db.query('SELECT owner_id, name FROM projects WHERE id = $1', [projectId]);
    if (projRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    if (Number(userId) === projRes.rows[0].owner_id) {
      return res.status(400).json({ success: false, message: 'Cannot remove the project owner from their project.' });
    }

    // Check permission
    const memberCheck = await db.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, currentUserId]
    );
    const isOwner = projRes.rows[0].owner_id === currentUserId;
    const isAdmin = memberCheck.rows.length > 0 && ['Admin', 'Owner'].includes(memberCheck.rows[0].role);

    if (!isOwner && !isAdmin && Number(userId) !== currentUserId) {
      return res.status(403).json({ success: false, message: 'Permission denied.' });
    }

    await db.query('DELETE FROM project_members WHERE project_id = $1 AND user_id = $2', [projectId, userId]);

    emitGlobal('team:member_unassigned', {
      userId: Number(userId),
      projectId: Number(projectId)
    });

    return res.json({ success: true, message: 'User removed from project.' });
  } catch (err) {
    console.error('removeUserFromProject error:', err);
    return res.status(500).json({ success: false, message: 'Failed to remove user from project.' });
  }
};
