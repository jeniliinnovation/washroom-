const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');
const authMiddleware = require('../middleware/auth');

router.get('/', ratingController.getRatings);
router.post('/', authMiddleware, ratingController.createRating);

module.exports = router;
