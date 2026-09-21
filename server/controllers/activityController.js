const db = require('../config/db');

// Get activity logs for a specific project
exports.getProjectActivities = async (req, res) => {
  try {
    const projectId = req.params.projectId || req.params.id;

    const result = await db.query(
      `SELECT a.*, u.name as user_name, u.avatar_url as user_avatar, u.email as user_email
       FROM activity_logs a
       LEFT JOIN users u ON a.user_id = u.id
       WHERE a.project_id = $1
       ORDER BY a.created_at DESC
       LIMIT 50`,
      [projectId]
    );

    const activities = result.rows.map(a => ({
      ...a,
      metadata: typeof a.metadata === 'string' ? JSON.parse(a.metadata || '{}') : a.metadata
    }));

    return res.json({ success: true, activities });
  } catch (err) {
    console.error('getProjectActivities error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch project activity.' });
  }
};

// Get recent global activity logs across all projects user participates in
exports.getGlobalActivities = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `SELECT 
         a.*, 
         p.name as project_name,
         p.color as project_color,
         u.name as user_name, 
         u.avatar_url as user_avatar
       FROM activity_logs a
       JOIN projects p ON a.project_id = p.id
       LEFT JOIN users u ON a.user_id = u.id
       LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = $1
       WHERE (p.owner_id = $1 OR pm.user_id = $1)
       ORDER BY a.created_at DESC
       LIMIT 25`,
      [userId]
    );

    const activities = result.rows.map(a => ({
      ...a,
      metadata: typeof a.metadata === 'string' ? JSON.parse(a.metadata || '{}') : a.metadata
    }));

    return res.json({ success: true, activities });
  } catch (err) {
    console.error('getGlobalActivities error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch global activity.' });
  }
};
