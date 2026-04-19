// ── routes/runner.routes.js ───────────────────────────
// FIX: ROUTE ORDER BUG — specific string routes must come BEFORE param routes
// /toggle-availability and /location must be defined BEFORE /:id
// otherwise Express matches them as { id: "toggle-availability" } and { id: "location" }
 
const express          = require("express")
const router           = express.Router()
const protect          = require("../middleware/auth.middleware")
const authorize        = require("../middleware/role.middleware")
const onlyApprovedRunner = require("../middleware/runner.middleware")
const {
  getRunners, getRunner, createRunner,
  updateRunner, updateAvailability,
  toggleAvailability, updateLocation, deleteRunner
} = require("../controllers/runner.controller")
 
// ── Specific routes FIRST (before any /:id routes) ───
router.patch("/toggle-availability", protect, toggleAvailability)  // runner toggles own status
router.patch("/location",            protect, updateLocation)       // runner updates own GPS
 
// ── Collection routes ─────────────────────────────────
router.get("/",    protect, getRunners)
router.post("/",   protect, createRunner)                           // any user can apply
 
// ── Param routes LAST ─────────────────────────────────
router.get("/:id",                protect, getRunner)
router.patch("/:id",              protect, authorize(["admin"]), updateRunner)
router.patch("/:id/availability", protect, authorize(["admin"]), updateAvailability) // admin sets availability
router.delete("/:id",             protect, authorize(["admin"]), deleteRunner)
 
module.exports = router