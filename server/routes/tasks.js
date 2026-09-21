const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const commentController = require('../controllers/commentController');
const attachmentController = require('../controllers/attachmentController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/my-tasks', taskController.getUserTasks);
router.get('/:id', taskController.getTaskById);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

// Nested task comments
router.get('/:taskId/comments', commentController.getTaskComments);
router.post('/:taskId/comments', commentController.createComment);

// Nested task attachments
router.post('/:taskId/attachments', attachmentController.upload.single('file'), attachmentController.uploadTaskAttachment);

module.exports = router;
