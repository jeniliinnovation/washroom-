const express = require('express');
const router = express.Router();
const supervisorController = require('../controllers/supervisorController');
const authMiddleware = require('../middleware/auth');

router.get('/dashboard', authMiddleware, supervisorController.getDashboard);
router.get('/team', authMiddleware, supervisorController.getTeam);
router.get('/tasks', authMiddleware, supervisorController.getTasks);
router.put('/verify/:id', authMiddleware, supervisorController.verifyComplaint);
router.put('/reopen/:id', authMiddleware, supervisorController.reopenComplaint);

module.exports = router;
