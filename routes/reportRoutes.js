const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middleware/auth');

router.get('/daily', authMiddleware, reportController.getDaily);
router.get('/weekly', authMiddleware, reportController.getWeekly);
router.get('/monthly', authMiddleware, reportController.getMonthly);
router.get('/yearly', authMiddleware, reportController.getYearly);
router.get('/export/pdf', authMiddleware, reportController.exportPdf);
router.get('/export/excel', authMiddleware, reportController.exportExcel);

module.exports = router;
