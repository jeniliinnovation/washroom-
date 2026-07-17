const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, notificationController.getNotifications);
router.put('/read/:id', authMiddleware, notificationController.markRead);
router.delete('/:id', authMiddleware, notificationController.deleteNotification);
router.post('/send', authMiddleware, notificationController.sendNotification);

module.exports = router;
