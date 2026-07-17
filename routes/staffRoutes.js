const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const authMiddleware = require('../middleware/auth');

router.get('/performance', authMiddleware, staffController.getStaffPerformance);
router.get('/attendance', authMiddleware, staffController.getStaffAttendance);
router.get('/', authMiddleware, staffController.getAllStaff);
router.post('/', authMiddleware, staffController.createStaff);

router.get('/:id', authMiddleware, staffController.getStaffById);
router.put('/:id/location', authMiddleware, staffController.updateLocation);
router.put('/:id', authMiddleware, staffController.updateStaff);
router.delete('/:id', authMiddleware, staffController.deleteStaff);

module.exports = router;
