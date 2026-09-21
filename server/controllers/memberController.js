const db = require('../config/db');
const { logActivity } = require('../utils/activity');
const { createNotification } = require('../utils/notification');
const { emitToProject } = require('../socket');

// Get project members
exports.getProjectMembers = async (req, res) => {
  try {
    const projectId = req.params.id || req.params.projectId;

    const result = await db.query(
      `SELECT pm.id as member_id, pm.role, pm.joined_at, u.id as user_id, u.name, u.email, u.avatar_url
       FROM project_members pm
       JOIN users u ON pm.user_id = u.id
       WHERE pm.project_id = $1
       ORDER BY pm.joined_at ASC`,
      [projectId]
    );

    return res.json({ success: true, members: result.rows });
  } catch (err) {
    console.error('getProjectMembers error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch members.' });
  }
};

// Add / Invite member to project
exports.addMember = async (req, res) => {
  try {
    const projectId = req.params.id || req.params.projectId;
    const { email, userId: targetUserId, role } = req.body;
    const currentUserId = req.user.id;

    let memberUserId = targetUserId;

    if (!memberUserId && email) {
      const userRes = await db.query('SELECT id, name, email FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
      if (userRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: `No user found with email ${email}` });
      }
      memberUserId = userRes.rows[0].id;
    }

    if (!memberUserId) {
      return res.status(400).json({ success: false, message: 'Please provide user email or ID.' });
    }

    // Check if already a member
    const existing = await db.query(
      'SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, memberUserId]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'User is already a member of this project.' });
    }

    const memberRole = role || 'Member';

    const insertRes = await db.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3) RETURNING *',
      [projectId, memberUserId, memberRole]
    );

    // Fetch member user details
    const userRes = await db.query('SELECT id, name, email, avatar_url FROM users WHERE id = $1', [memberUserId]);
    const projRes = await db.query('SELECT name FROM projects WHERE id = $1', [projectId]);

    const memberData = {
      member_id: insertRes.rows[0].id,
      role: memberRole,
      joined_at: insertRes.rows[0].joined_at,
      user_id: userRes.rows[0].id,
      name: userRes.rows[0].name,
      email: userRes.rows[0].email,
      avatar_url: userRes.rows[0].avatar_url
    };

    // Log Activity
    await logActivity(projectId, currentUserId, 'added_member', 'member', memberUserId, {
      memberName: userRes.rows[0].name,
      role: memberRole
    });

    // Notify new member
    await createNotification(
      memberUserId,
      currentUserId,
      'project_invite',
      'Added to Project',
      `${req.user.name} added you to project "${projRes.rows[0]?.name}" as ${memberRole}`,
      `/projects/${projectId}`
    );

    emitToProject(projectId, 'member:added', memberData);

    return res.status(201).json({
      success: true,
      message: 'Member added to project successfully.',
      member: memberData
    });
  } catch (err) {
    console.error('addMember error:', err);
    return res.status(500).json({ success: false, message: 'Failed to add member.' });
  }
};

// Update member role
exports.updateMemberRole = async (req, res) => {
  try {
    const projectId = req.params.id || req.params.projectId;
    const targetUserId = req.params.userId;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ success: false, message: 'Role is required.' });
    }

    // Protect project owner from being demoted by someone else
    const projRes = await db.query('SELECT owner_id FROM projects WHERE id = $1', [projectId]);
    if (projRes.rows.length > 0 && projRes.rows[0].owner_id === Number(targetUserId) && role !== 'Owner') {
      return res.status(400).json({ success: false, message: 'Cannot demote the primary project owner.' });
    }

    const updateRes = await db.query(
      'UPDATE project_members SET role = $1 WHERE project_id = $2 AND user_id = $3 RETURNING *',
      [role, projectId, targetUserId]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Member not found in project.' });
    }

    const userRes = await db.query('SELECT name FROM users WHERE id = $1', [targetUserId]);

    await logActivity(projectId, req.user.id, 'updated_member_role', 'member', targetUserId, {
      memberName: userRes.rows[0]?.name,
      newRole: role
    });

    emitToProject(projectId, 'member:role_updated', {
      userId: Number(targetUserId),
      role
    });

    return res.json({ success: true, message: 'Member role updated successfully.' });
  } catch (err) {
    console.error('updateMemberRole error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update member role.' });
  }
};

// Remove member from project
exports.removeMember = async (req, res) => {
  try {
    const projectId = req.params.id || req.params.projectId;
    const targetUserId = req.params.userId;

    // Check if target is project owner
    const projRes = await db.query('SELECT owner_id, name FROM projects WHERE id = $1', [projectId]);
    if (projRes.rows.length > 0 && projRes.rows[0].owner_id === Number(targetUserId)) {
      return res.status(400).json({ success: false, message: 'Cannot remove the primary project owner.' });
    }

    const userRes = await db.query('SELECT name FROM users WHERE id = $1', [targetUserId]);

    await db.query(
      'DELETE FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, targetUserId]
    );

    // Unassign their tasks in this project
    await db.query(
      'UPDATE tasks SET assignee_id = NULL WHERE project_id = $1 AND assignee_id = $2',
      [projectId, targetUserId]
    );

    await logActivity(projectId, req.user.id, 'removed_member', 'member', targetUserId, {
      memberName: userRes.rows[0]?.name
    });

    emitToProject(projectId, 'member:removed', {
      userId: Number(targetUserId)
    });

    return res.json({ success: true, message: 'Member removed from project.' });
  } catch (err) {
    console.error('removeMember error:', err);
    return res.status(500).json({ success: false, message: 'Failed to remove member.' });
  }
};
