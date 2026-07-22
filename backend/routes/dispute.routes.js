const express  = require("express")
const router   = express.Router()
const protect  = require("../middleware/auth.middleware")
const adminAuth = require("../middleware/admin.middleware")
const {
  createDispute,
  getMyDisputes,
  getDispute
} = require("../controllers/dispute.controller")

// User routes
router.post("/", protect, createDispute)   // raise a dispute
router.get("/", protect, getMyDisputes)   // view my disputes
router.get("/:id", protect, getDispute)      // view single dispute

module.exports = router