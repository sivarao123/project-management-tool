const db = require('../config/db');
const { emitToUser } = require('../socket');

async function createNotification(userId, senderId, type, title, message, link = null) {
  try {
    if (!userId || userId === senderId) {
      // Don't notify oneself
      return null;
    }

    const res = await db.query(
      `INSERT INTO notifications (user_id, sender_id, type, title, message, link, is_read)
       VALUES ($1, $2, $3, $4, $5, $6, FALSE) RETURNING *`,
      [userId, senderId, type, title, message, link]
    );

    const notification = res.rows[0];

    // Fetch sender info
    if (senderId) {
      const senderRes = await db.query('SELECT name, avatar_url FROM users WHERE id = $1', [senderId]);
      notification.sender_name = senderRes.rows[0]?.name;
      notification.sender_avatar = senderRes.rows[0]?.avatar_url;
    }

    // Emit live to specific user's socket room
    emitToUser(userId, 'notification:new', notification);
    return notification;
  } catch (err) {
    console.error('[Notification Error]', err.message);
    return null;
  }
}

module.exports = {
  createNotification
};
