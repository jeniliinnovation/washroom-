const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', taskController.getAllTasks);
router.post('/', authMiddleware, taskController.createTask);

router.get('/:id', taskController.getTaskById);
router.put('/:id/start', authMiddleware, taskController.startTask);
router.put('/:id/pause', authMiddleware, taskController.pauseTask);
router.put('/:id/resume', authMiddleware, taskController.resumeTask);
router.put('/:id/complete', authMiddleware, taskController.completeTask);
router.put('/:id/cancel', authMiddleware, taskController.cancelTask);

router.post('/:id/before-photo', authMiddleware, upload.single('photo'), taskController.uploadBeforePhoto);
router.post('/:id/after-photo', authMiddleware, upload.single('photo'), taskController.uploadAfterPhoto);

module.exports = router;
