const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');
const protect = require('../middleware/auth.middleware');

router.post('/', protect, ratingController.submitRating);
router.get('/user/:userId', ratingController.getUserRatings); // public read, no auth needed

module.exports = router;