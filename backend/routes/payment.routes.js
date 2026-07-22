// ── routes/payment.routes.js ─────────────────────────
// FIX: was missing verifyPayment and webhook routes entirely
 
const express           = require("express")
const router            = express.Router()
const protect           = require("../middleware/auth.middleware")
const paymentController = require("../controllers/payment.controller")
 
// Paystack webhook — NO auth (Paystack calls this server-to-server)
// Must be raw body for signature verification
router.post("/webhook", express.raw({ type: "application/json" }), paymentController.webhook)
 
// Authenticated payment routes
router.post("/initialize",       protect, paymentController.initializePayment)
router.get("/verify/:reference", protect, paymentController.verifyPayment)
 
module.exports = router