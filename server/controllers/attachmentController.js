const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('../config/db');
const { logActivity } = require('../utils/activity');
const { emitToProject } = require('../socket');

// Configure Multer storage
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${uniqueSuffix}-${sanitized}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Upload attachment to a task
const uploadTaskAttachment = async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const file = req.file;
    const userId = req.user.id;

    if (!file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    // Get task
    const taskRes = await db.query('SELECT project_id, title FROM tasks WHERE id = $1', [taskId]);
    if (taskRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }
    const { project_id, title } = taskRes.rows[0];

    const fileUrl = `/uploads/${file.filename}`;

    const insertRes = await db.query(
      `INSERT INTO attachments (task_id, uploader_id, file_name, file_url, file_size, file_type)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [taskId, userId, file.originalname, fileUrl, file.size, file.mimetype]
    );

    const attachment = insertRes.rows[0];
    attachment.uploader_name = req.user.name;
    attachment.uploader_avatar = req.user.avatar_url;

    // Log Activity
    await logActivity(project_id, userId, 'uploaded_attachment', 'task', taskId, {
      taskTitle: title,
      fileName: file.originalname
    });

    emitToProject(project_id, 'attachment:uploaded', {
      taskId: Number(taskId),
      attachment
    });

    return res.status(201).json({
      success: true,
      message: 'Attachment uploaded successfully.',
      attachment
    });
  } catch (err) {
    console.error('uploadTaskAttachment error:', err);
    return res.status(500).json({ success: false, message: 'Failed to upload attachment.' });
  }
};

// Delete attachment
const deleteAttachment = async (req, res) => {
  try {
    const attachmentId = req.params.id;
    const userId = req.user.id;

    const attachRes = await db.query(
      `SELECT a.*, t.project_id, t.title as task_title
       FROM attachments a
       JOIN tasks t ON a.task_id = t.id
       WHERE a.id = $1`,
      [attachmentId]
    );

    if (attachRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Attachment not found.' });
    }

    const attachment = attachRes.rows[0];

    if (attachment.uploader_id !== userId && req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Permission denied to delete this attachment.' });
    }

    // Attempt to remove file from disk
    const fileName = path.basename(attachment.file_url);
    const fullPath = path.join(uploadDir, fileName);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    await db.query('DELETE FROM attachments WHERE id = $1', [attachmentId]);

    emitToProject(attachment.project_id, 'attachment:deleted', {
      taskId: attachment.task_id,
      attachmentId: Number(attachmentId)
    });

    return res.json({ success: true, message: 'Attachment deleted.' });
  } catch (err) {
    console.error('deleteAttachment error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete attachment.' });
  }
};

module.exports = {
  upload,
  uploadTaskAttachment,
  deleteAttachment
};
