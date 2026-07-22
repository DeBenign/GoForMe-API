// routes/payout.routes.js
const express  = require("express")
const router   = express.Router()
const protect  = require("../middleware/auth.middleware")
const {
  getBanks,
  verifyAccount,
  saveBankDetails,
  requestPayout,
  getPayoutHistory,
  payoutWebhook
} = require("../controllers/payout.controller")

// Paystack webhook — NO auth, raw body for signature check
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  payoutWebhook
)

// All routes below require authentication
router.get("/banks",           protect, getBanks)
router.post("/verify-account", protect, verifyAccount)
router.post("/save-bank",      protect, saveBankDetails)
router.post("/request",        protect, requestPayout)
router.get("/history",         protect, getPayoutHistory)

module.exports = router