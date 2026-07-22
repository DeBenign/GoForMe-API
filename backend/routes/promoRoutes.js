const express = require('express');
const router = express.Router();
const promoController = require('../controllers/promoController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/auth'); // adjust to your actual admin-check middleware

router.post('/preview', authenticate, promoController.previewPromo);
router.post('/', authenticate, requireAdmin, promoController.createPromo);
router.get('/', authenticate, requireAdmin, promoController.listPromos);

module.exports = router;

// Mount in your main app/router with: app.use('/api/promos', promoRoutes);