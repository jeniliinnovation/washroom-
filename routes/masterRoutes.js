const express = require('express');
const router = express.Router();
const masterController = require('../controllers/masterController');

router.get('/categories', masterController.getCategories);
router.get('/status', masterController.getStatusList);
router.get('/cities', masterController.getCities);
router.get('/states', masterController.getStates);
router.get('/areas', masterController.getAreas);
router.get('/wards', masterController.getWards);
router.get('/facilities', masterController.getFacilities);
router.get('/roles', masterController.getRoles);
router.get('/permissions', masterController.getPermissions);
router.get('/priority', masterController.getPriorityList);
router.get('/notification-templates', masterController.getNotificationTemplates);

module.exports = router;
