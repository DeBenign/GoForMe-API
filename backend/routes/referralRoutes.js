const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referralController');
const protect = require('../middleware/auth.middleware');

router.get('/me', protect, referralController.getMyReferralInfo);
router.post('/apply', protect, referralController.applyReferralCode);

module.exports = router;