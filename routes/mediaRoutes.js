const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/mediaController');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');

// Handle /api/media/:id
router.delete('/:id', authMiddleware, mediaController.deleteMedia);

module.exports = router;
