const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaintController');
const mediaController = require('../controllers/mediaController');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');

// Specific paths before :id routes
router.get('/history', complaintController.getComplaintHistory);
router.get('/timeline/:id', complaintController.getComplaintTimeline);

router.post('/', upload.array('images', 5), complaintController.submitComplaint);
router.get('/', complaintController.getAllComplaints);

// Media endpoints on /api/complaints/:id/...
router.get('/:id/media', mediaController.getComplaintMedia);
router.post('/:id/photos', authMiddleware, upload.array('photos', 5), mediaController.uploadPhotos);
router.post('/:id/videos', authMiddleware, upload.single('video'), mediaController.uploadVideos);

router.get('/:id', complaintController.getComplaintById);
router.put('/:id', authMiddleware, complaintController.updateComplaint);
router.delete('/:id', authMiddleware, complaintController.deleteComplaint);

router.put('/:id/cancel', authMiddleware, complaintController.cancelComplaint);
router.put('/:id/priority', authMiddleware, complaintController.updatePriority);
router.put('/:id/status', authMiddleware, upload.array('after_images', 5), complaintController.updateComplaintStatus);
router.put('/:id/assign', authMiddleware, complaintController.assignStaff);

module.exports = router;
