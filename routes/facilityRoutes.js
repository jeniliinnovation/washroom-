const express = require('express');
const router = express.Router();
const facilityController = require('../controllers/facilityController');
const authMiddleware = require('../middleware/auth');

router.get('/', facilityController.getFacilities);
router.post('/', authMiddleware, facilityController.createFacility);
router.put('/:id', authMiddleware, facilityController.updateFacility);
router.delete('/:id', authMiddleware, facilityController.deleteFacility);

module.exports = router;
