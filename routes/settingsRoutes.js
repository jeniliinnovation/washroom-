const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const authMiddleware = require('../middleware/auth');

router.get('/email', authMiddleware, settingsController.getEmailSettings);
router.put('/email', authMiddleware, settingsController.updateEmailSettings);

router.get('/sms', authMiddleware, settingsController.getSmsSettings);
router.put('/sms', authMiddleware, settingsController.updateSmsSettings);

router.get('/push', authMiddleware, settingsController.getPushSettings);
router.put('/push', authMiddleware, settingsController.updatePushSettings);

router.get('/storage', authMiddleware, settingsController.getStorageSettings);
router.put('/storage', authMiddleware, settingsController.updateStorageSettings);

router.get('/', authMiddleware, settingsController.getSettings);
router.put('/', authMiddleware, settingsController.updateSettings);

module.exports = router;
