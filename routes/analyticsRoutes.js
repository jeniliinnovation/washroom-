const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/auth');

router.get('/complaints', authMiddleware, analyticsController.getComplaintsAnalytics);
router.get('/resolution-time', authMiddleware, analyticsController.getResolutionTime);
router.get('/top-problem-areas', authMiddleware, analyticsController.getTopProblemAreas);
router.get('/staff-performance', authMiddleware, analyticsController.getStaffPerformanceAnalytics);
router.get('/heatmap', authMiddleware, analyticsController.getHeatmap);
router.get('/monthly', authMiddleware, analyticsController.getMonthlyTrends);
router.get('/dashboard', authMiddleware, analyticsController.getAnalyticsDashboard);

module.exports = router;
