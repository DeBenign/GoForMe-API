// ── routes/auth.routes.js ─────────────────────────────
// ✅ Clean — no changes needed
const express = require("express")
const router  = express.Router()
const { register, login, logout, verifyOTP, resendOTP, refreshToken } = require("../controllers/auth.controller")
const protect = require("../middleware/auth.middleware")
 
router.post("/register",   register)
router.post("/verify-otp", verifyOTP)
router.post("/resend-otp", resendOTP)
router.post("/login",      login)
router.post("/refresh-token",    refreshToken)
router.post("/logout", protect, logout)
 
module.exports = router