const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const authMiddleware = require('../middleware/auth');

router.get('/login', authMiddleware, auditController.getLoginLogs);
router.get('/activity', authMiddleware, auditController.getActivityLogs);
router.get('/error', authMiddleware, auditController.getErrorLogs);
router.get('/', authMiddleware, auditController.getLogs);

module.exports = router;
