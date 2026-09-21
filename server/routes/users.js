const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', userController.getAllUsers);
router.post('/:userId/projects', userController.assignUserToProject);
router.delete('/:userId/projects/:projectId', userController.removeUserFromProject);

module.exports = router;
