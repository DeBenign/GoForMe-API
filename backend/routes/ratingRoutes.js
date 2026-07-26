const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');
const protect = require('../middleware/auth.middleware');
const adminAuth = require('../middleware/admin.middleware');

router.post('/', protect, ratingController.submitRating);
router.get('/platform', adminAuth, ratingController.getPlatformRatings); // admin-only aggregate
router.get('/user/:userId', ratingController.getUserRatings); // public read, no auth needed

module.exports = router;