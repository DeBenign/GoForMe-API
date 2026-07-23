const express = require('express');
const router = express.Router();
const promoController = require('../controllers/promoController');
const protect = require('../middleware/auth.middleware');
const adminAuth = require('../middleware/admin.middleware'); // runs protect internally, then checks role === "admin"

router.post('/preview', protect, promoController.previewPromo);
router.post('/', adminAuth, promoController.createPromo);
router.get('/', adminAuth, promoController.listPromos);

module.exports = router;