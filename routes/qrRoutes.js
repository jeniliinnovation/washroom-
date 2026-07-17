const express = require('express');
const router = express.Router();
const qrController = require('../controllers/qrController');
const authMiddleware = require('../middleware/auth');

router.post('/generate', authMiddleware, qrController.generateQr);
router.post('/scan', qrController.scanQr);
router.get('/:washroomId', qrController.getQrByWashroomId);

module.exports = router;
