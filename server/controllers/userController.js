const db = require('../config/db');

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

    const users = result.rows.map(u => ({
      ...u,
      project_count: Number(u.project_count) || 0,
      active_tasks_count: Number(u.active_tasks_count) || 0
    }));

    return res.json({ success: true, users });
  } catch (err) {
    console.error('getAllUsers error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch users.' });
  }
};
