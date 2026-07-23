// ── routes/admin.routes.js ────────────────────────────
// FIX: adminAuth was used WITHOUT protect running first
// req.user is set by protect — without it req.user is always undefined
// so every admin route was returning 403 regardless of who called it
// Now adminAuth internally runs protect first (see admin.middleware.js fix)
 
const express         = require("express")
const router          = express.Router()
const adminAuth       = require("../middleware/admin.middleware")
const adminController = require("../controllers/admin.controller")
const { getAllPayouts } = require("../controllers/payout.controller")
const {
  getAllDisputes,
  resolveDispute,
  updateDisputeStatus
} = require("../controllers/dispute.controller")


router.get("/users", adminAuth, adminController.getUsers)
router.get("/orders", adminAuth, adminController.getOrders)
router.patch("/orders/:id/override", adminAuth, adminController.overrideOrder)
router.patch("/runners/:id/approve", adminAuth, adminController.approveRunner)
router.patch("/runners/:id/reject", adminAuth, adminController.rejectRunner)
router.patch("/users/:id/promote", adminAuth, adminController.promoteUser)
router.get("/payouts", adminAuth, getAllPayouts)
router.get("/disputes", adminAuth, getAllDisputes)
router.patch("/disputes/:id/resolve", adminAuth, resolveDispute)
router.patch("/disputes/:id/status", adminAuth, updateDisputeStatus)

module.exports = router