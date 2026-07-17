const express = require('express');
const router = express.Router();
const washroomController = require('../controllers/washroomController');
const facilityController = require('../controllers/facilityController');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');

// Specific paths first before :id param routes
router.get('/nearby', washroomController.getNearbyWashrooms);
router.get('/search', washroomController.searchWashrooms);
router.get('/map', washroomController.getMapWashrooms);
router.get('/', washroomController.getAllWashrooms);
router.post('/', authMiddleware, washroomController.createWashroom);

router.get('/images/:id', washroomController.getWashroomImages);
router.delete('/images/:id', authMiddleware, washroomController.deleteWashroomImage);

router.post('/:id/facilities', authMiddleware, facilityController.assignFacilityToWashroom);
router.delete('/:id/facilities/:facilityId', authMiddleware, facilityController.removeFacilityFromWashroom);

router.get('/:id/images', washroomController.getWashroomImages);
router.post('/:id/images', authMiddleware, upload.single('image'), washroomController.uploadWashroomImage);

router.get('/:id', washroomController.getWashroomById);
router.put('/:id', authMiddleware, washroomController.updateWashroom);
router.delete('/:id', authMiddleware, washroomController.deleteWashroom);

module.exports = router;
