const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const taskController = require('../controllers/taskController');
const memberController = require('../controllers/memberController');
const activityController = require('../controllers/activityController');
const { authenticate, checkProjectRole } = require('../middleware/auth');

router.use(authenticate);

router.get('/', projectController.getProjects);
router.post('/', projectController.createProject);
router.get('/:id', checkProjectRole('Viewer'), projectController.getProjectById);
router.put('/:id', checkProjectRole('Admin'), projectController.updateProject);
router.delete('/:id', checkProjectRole('Owner'), projectController.deleteProject);
router.put('/:id/archive', checkProjectRole('Admin'), projectController.archiveProject);
router.put('/:id/restore', checkProjectRole('Admin'), projectController.restoreProject);

// Nested routes for project tasks
router.get('/:projectId/tasks', checkProjectRole('Viewer'), taskController.getProjectTasks);
router.post('/:projectId/tasks', checkProjectRole('Member'), taskController.createTask);
router.put('/:projectId/tasks/reorder', checkProjectRole('Member'), taskController.reorderTasks);

// Nested routes for project members
router.get('/:id/members', checkProjectRole('Viewer'), memberController.getProjectMembers);
router.post('/:id/members', checkProjectRole('Admin'), memberController.addMember);
router.put('/:id/members/:userId', checkProjectRole('Admin'), memberController.updateMemberRole);
router.delete('/:id/members/:userId', checkProjectRole('Admin'), memberController.removeMember);

// Nested routes for project activities
router.get('/:projectId/activities', checkProjectRole('Viewer'), activityController.getProjectActivities);

module.exports = router;
