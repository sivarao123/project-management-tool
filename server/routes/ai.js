const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/agent', aiController.agentChat);
router.post('/breakdown', aiController.breakdownFeature);
router.post('/enhance-task', aiController.enhanceTask);
router.post('/standup', aiController.generateStandup);
router.post('/execute-actions', aiController.executeActions);

module.exports = router;
