// ── routes/wallet.routes.js ───────────────────────────
// FIX 1: CRITICAL ROUTE ORDER BUG
//   GET /verify was defined AFTER GET /:id
//   Express matched /verify as /:id with id="verify" → getWallet was called with id="verify"
//   Mongoose threw CastError: "verify" is not a valid ObjectId
//   The actual verifyWalletFunding handler was NEVER reached
//
// FIX 2: /verify had no protect middleware — anyone could call it unauthenticated
// FIX 3: added GET /me for the logged-in user's own wallet (uses getMyWallet)
 
const express = require("express")
const router  = express.Router()
const protect = require("../middleware/auth.middleware")
const authorize = require("../middleware/role.middleware")
const {
  getWallets, getWallet, getMyWallet, fundWallet, verifyWalletFunding
} = require("../controllers/wallet.controller")
 
// ── Specific routes FIRST ─────────────────────────────
router.get("/me",     protect, getMyWallet)          // logged-in user's own wallet
router.get("/verify", protect, verifyWalletFunding)  // FIX: moved BEFORE /:id + added protect
 
// ── Collection + param routes AFTER ──────────────────
router.get("/",    protect, authorize(["admin"]), getWallets) // admin only
router.get("/:id", protect, authorize(["admin"]), getWallet)  // admin only
 
// Fund wallet (initialize Paystack payment)
router.post("/fund", protect, fundWallet)
 
module.exports = router