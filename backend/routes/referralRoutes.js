const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referralController');
const { authenticate } = require('../middleware/auth'); // adjust to your actual auth middleware name

router.get('/me', authenticate, referralController.getMyReferralInfo);
router.post('/apply', authenticate, referralController.applyReferralCode);

module.exports = router;

// Mount in your main app/router with: app.use('/api/referrals', referralRoutes);