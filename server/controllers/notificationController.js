const db = require('../config/db');

// Get all notifications for current user
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `SELECT n.*, u.name as sender_name, u.avatar_url as sender_avatar
       FROM notifications n
       LEFT JOIN users u ON n.sender_id = u.id
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [userId]
    );

    const unreadCountRes = await db.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND (is_read = 0 OR is_read IS FALSE)',
      [userId]
    );

    return res.json({
      success: true,
      notifications: result.rows,
      unreadCount: Number(unreadCountRes.rows[0]?.count) || 0
    });
  } catch (err) {
    console.error('getNotifications error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch notifications.' });
  }
};

// Mark single notification as read
exports.markAsRead = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id;

    await db.query(
      'UPDATE notifications SET is_read = 1 WHERE id = $1 AND user_id = $2',
      [notificationId, userId]
    );

    return res.json({ success: true, message: 'Notification marked as read.' });
  } catch (err) {
    console.error('markAsRead error:', err);
    return res.status(500).json({ success: false, message: 'Failed to mark notification as read.' });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await db.query(
      'UPDATE notifications SET is_read = 1 WHERE user_id = $1',
      [userId]
    );

    return res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    console.error('markAllAsRead error:', err);
    return res.status(500).json({ success: false, message: 'Failed to mark notifications as read.' });
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id;

    await db.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2',
      [notificationId, userId]
    );

    return res.json({ success: true, message: 'Notification deleted.' });
  } catch (err) {
    console.error('deleteNotification error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete notification.' });
  }
};
