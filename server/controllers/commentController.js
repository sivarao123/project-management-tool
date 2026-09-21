const db = require('../config/db');
const { logActivity } = require('../utils/activity');
const { createNotification } = require('../utils/notification');
const { emitToProject } = require('../socket');

// Get comments for a task
exports.getTaskComments = async (req, res) => {
  try {
    const taskId = req.params.taskId;

    const result = await db.query(
      `SELECT c.*, u.name as author_name, u.avatar_url as author_avatar, u.email as author_email
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.task_id = $1
       ORDER BY c.created_at ASC`,
      [taskId]
    );

    return res.json({ success: true, comments: result.rows });
  } catch (err) {
    console.error('getTaskComments error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch comments.' });
  }
};

// Create a comment
exports.createComment = async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const { content, parent_id } = req.body;
    const userId = req.user.id;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Comment content cannot be empty.' });
    }

    // Get task and project details
    const taskRes = await db.query(
      'SELECT id, project_id, title, assignee_id, creator_id FROM tasks WHERE id = $1',
      [taskId]
    );

    if (taskRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const task = taskRes.rows[0];

    const insertRes = await db.query(
      `INSERT INTO comments (task_id, user_id, parent_id, content)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [taskId, userId, parent_id || null, content.trim()]
    );

    const newComment = insertRes.rows[0];
    newComment.author_name = req.user.name;
    newComment.author_avatar = req.user.avatar_url;
    newComment.author_email = req.user.email;

    // Log Activity
    await logActivity(task.project_id, userId, 'added_comment', 'comment', taskId, {
      taskTitle: task.title,
      commentId: newComment.id
    });

    // Notify task assignee if not the commenter
    if (task.assignee_id && task.assignee_id !== userId) {
      await createNotification(
        task.assignee_id,
        userId,
        'comment',
        'New Comment',
        `${req.user.name} commented on "${task.title}"`,
        `/projects/${task.project_id}?task=${taskId}`
      );
    }

    // Notify task creator if different from commenter and assignee
    if (task.creator_id && task.creator_id !== userId && task.creator_id !== task.assignee_id) {
      await createNotification(
        task.creator_id,
        userId,
        'comment',
        'New Comment',
        `${req.user.name} commented on "${task.title}"`,
        `/projects/${task.project_id}?task=${taskId}`
      );
    }

    // Real-time broadcast
    emitToProject(task.project_id, 'comment:created', {
      taskId: Number(taskId),
      comment: newComment
    });

    return res.status(201).json({
      success: true,
      message: 'Comment added successfully.',
      comment: newComment
    });
  } catch (err) {
    console.error('createComment error:', err);
    return res.status(500).json({ success: false, message: 'Failed to add comment.' });
  }
};

// Update a comment
exports.updateComment = async (req, res) => {
  try {
    const commentId = req.params.id;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Comment content cannot be empty.' });
    }

    const checkRes = await db.query(
      `SELECT c.*, t.project_id FROM comments c JOIN tasks t ON c.task_id = t.id WHERE c.id = $1`,
      [commentId]
    );

    if (checkRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Comment not found.' });
    }

    const comment = checkRes.rows[0];

    if (comment.user_id !== userId && req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'You can only edit your own comments.' });
    }

    const updateRes = await db.query(
      `UPDATE comments SET content = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [content.trim(), commentId]
    );

    const updated = updateRes.rows[0];
    updated.author_name = req.user.name;
    updated.author_avatar = req.user.avatar_url;

    emitToProject(comment.project_id, 'comment:updated', {
      taskId: comment.task_id,
      comment: updated
    });

    return res.json({ success: true, message: 'Comment updated.', comment: updated });
  } catch (err) {
    console.error('updateComment error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update comment.' });
  }
};

// Delete a comment
exports.deleteComment = async (req, res) => {
  try {
    const commentId = req.params.id;
    const userId = req.user.id;

    const checkRes = await db.query(
      `SELECT c.*, t.project_id FROM comments c JOIN tasks t ON c.task_id = t.id WHERE c.id = $1`,
      [commentId]
    );

    if (checkRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Comment not found.' });
    }

    const comment = checkRes.rows[0];

    if (comment.user_id !== userId && req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'You can only delete your own comments.' });
    }

    await db.query('DELETE FROM comments WHERE id = $1', [commentId]);

    emitToProject(comment.project_id, 'comment:deleted', {
      taskId: comment.task_id,
      commentId: Number(commentId)
    });

    return res.json({ success: true, message: 'Comment deleted successfully.' });
  } catch (err) {
    console.error('deleteComment error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete comment.' });
  }
};
