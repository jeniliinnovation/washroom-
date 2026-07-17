const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/auth');

router.get('/admin', authMiddleware, dashboardController.getAdminDashboard);
router.get('/staff', authMiddleware, dashboardController.getStaffDashboard);
router.get('/supervisor', authMiddleware, dashboardController.getSupervisorDashboard);
router.get('/citizen', authMiddleware, dashboardController.getCitizenDashboard);

module.exports = router;
