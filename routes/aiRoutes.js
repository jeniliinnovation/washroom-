const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const authMiddleware = require('../middleware/auth');

router.post('/detect-dirty', aiController.detectDirty);
router.post('/image-score', aiController.imageScore);
router.post('/detect-damage', aiController.detectDamage);
router.post('/chat', aiController.chat);
router.post('/summarize', aiController.summarize);
router.post('/priority', aiController.priority);
router.post('/duplicate', aiController.duplicate);
router.post('/moderation', aiController.moderation);
router.post('/analyze', authMiddleware, aiController.analyzeImage);

module.exports = router;
