const db = require('../config/db');

exports.globalSearch = async (req, res) => {
  try {
    const q = req.query.q;
    const userId = req.user.id;

    if (!q || !q.trim()) {
      return res.json({
        success: true,
        results: { projects: [], tasks: [], members: [], comments: [] }
      });
    }

    const searchTerm = `%${q.trim().toLowerCase()}%`;

    // 1. Projects search
    const projRes = await db.query(
      `SELECT DISTINCT p.id, p.name, p.description, p.color, p.priority, p.status
       FROM projects p
       LEFT JOIN project_members pm ON p.id = pm.project_id
       WHERE (p.owner_id = $1 OR pm.user_id = $1)
         AND (LOWER(p.name) LIKE $2 OR LOWER(p.description) LIKE $2)
       LIMIT 10`,
      [userId, searchTerm]
    );

    // 2. Tasks search
    const taskRes = await db.query(
      `SELECT DISTINCT t.id, t.title, t.description, t.status, t.priority, t.due_date,
              t.project_id, p.name as project_name, p.color as project_color,
              u.name as assignee_name, u.avatar_url as assignee_avatar
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       LEFT JOIN project_members pm ON p.id = pm.project_id
       LEFT JOIN users u ON t.assignee_id = u.id
       WHERE (p.owner_id = $1 OR pm.user_id = $1)
         AND (LOWER(t.title) LIKE $2 OR LOWER(t.description) LIKE $2)
       LIMIT 15`,
      [userId, searchTerm]
    );

    // 3. Team members search
    const memRes = await db.query(
      `SELECT DISTINCT u.id, u.name, u.email, u.avatar_url, u.role, u.bio
       FROM users u
       WHERE LOWER(u.name) LIKE $1 OR LOWER(u.email) LIKE $1
       LIMIT 10`,
      [searchTerm]
    );

    // 4. Comments search
    const commRes = await db.query(
      `SELECT c.id, c.content, c.task_id, c.created_at,
              t.title as task_title, t.project_id,
              u.name as author_name, u.avatar_url as author_avatar
       FROM comments c
       JOIN tasks t ON c.task_id = t.id
       JOIN projects p ON t.project_id = p.id
       JOIN users u ON c.user_id = u.id
       LEFT JOIN project_members pm ON p.id = pm.project_id
       WHERE (p.owner_id = $1 OR pm.user_id = $1)
         AND LOWER(c.content) LIKE $2
       LIMIT 10`,
      [userId, searchTerm]
    );

    return res.json({
      success: true,
      results: {
        projects: projRes.rows,
        tasks: taskRes.rows,
        members: memRes.rows,
        comments: commRes.rows
      }
    });
  } catch (err) {
    console.error('globalSearch error:', err);
    return res.status(500).json({ success: false, message: 'Search failed.' });
  }
};
