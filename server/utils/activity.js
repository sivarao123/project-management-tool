const db = require('../config/db');
const { emitToProject } = require('../socket');

async function logActivity(projectId, userId, action, entityType, entityId, metadata = {}) {
  try {
    const metaStr = typeof metadata === 'string' ? metadata : JSON.stringify(metadata);
    const result = await db.query(
      `INSERT INTO activity_logs (project_id, user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [projectId, userId, action, entityType, entityId, metaStr]
    );

    const log = result.rows[0];

    // Fetch user details to send with the real-time event
    const userRes = await db.query('SELECT name, avatar_url, email FROM users WHERE id = $1', [userId]);
    const enrichedLog = {
      ...log,
      user_name: userRes.rows[0]?.name || 'System',
      user_avatar: userRes.rows[0]?.avatar_url || null,
      metadata: typeof log.metadata === 'string' ? JSON.parse(log.metadata || '{}') : log.metadata
    };

    emitToProject(projectId, 'activity:new', enrichedLog);
    return enrichedLog;
  } catch (err) {
    console.error('[ActivityLog Error]', err.message);
  }
}

module.exports = {
  logActivity
};
