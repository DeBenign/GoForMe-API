const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, ratingController.submitRating);
router.get('/user/:userId', ratingController.getUserRatings); // public read, no auth needed

module.exports = router;

// Mount in your main app/router with: app.use('/api/ratings', ratingRoutes);