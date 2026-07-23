// ── routes/order.routes.js ────────────────────────────
// FIX: added missing GET routes and cancelOrder
// FIX: onlyApprovedRunner now uses flag — only check availability on accept,
//      NOT on start/complete (runner is already on the job so isAvailable = false)
 
const express          = require("express")
const router           = express.Router()
const protect          = require("../middleware/auth.middleware")
const onlyApprovedRunner = require("../middleware/runner.middleware")
const {
  createOrder, getOrders, getRunnerOrders, getOrder,
  acceptOrder, startOrder, completeOrder, declineOrder, cancelOrder
} = require("../controllers/order.controller")
 
router.post("/",    protect, createOrder)   // Customer creates order
router.get("/",     protect, getOrders)     // Customer sees their orders
router.get("/runner/mine", protect, getRunnerOrders)  // ADDED: runner sees their assigned errands (must come before /:id)
router.get("/:id",  protect, getOrder)      // Get single order detail
 
// Runner actions — checkAvailability=true only for accept (runner must be online)
router.patch("/:id/accept",   protect, onlyApprovedRunner(true),  acceptOrder)
router.patch("/:id/start",    protect, onlyApprovedRunner(false), startOrder)    // already on job
router.patch("/:id/complete", protect, onlyApprovedRunner(false), completeOrder) // already on job
router.patch("/:id/decline",  protect, onlyApprovedRunner(false), declineOrder)  // ADDED: decline a freshly auto-matched errand
router.patch("/:id/cancel",   protect, cancelOrder)
 
module.exports = router