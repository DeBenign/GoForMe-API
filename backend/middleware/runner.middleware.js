// ── middleware/runner.middleware.js ───────────────────
// FIX: the original blocked ANY runner action if isAvailable === false.
// When a runner accepts an order they are marked isAvailable = false.
// This meant startOrder and completeOrder would always block them mid-job!
// Solution: only check isAvailable for "accept" actions, not for in-progress ones.
// Use a flag parameter to control the availability check.
 
const Runner = require("../models/Runner")
 
const onlyApprovedRunner = (checkAvailability = false) => {
  return async (req, res, next) => {
    try {
      const runner = await Runner.findOne({ user_id: req.user._id })
 
      if (!runner) {
        return res.status(403).json({ success: false, message: "Runner profile not found" })
      }
 
      if (runner.status !== "approved") {
        return res.status(403).json({ success: false, message: "Your runner account is not approved yet" })
      }
 
      // Only enforce availability check when accepting new orders
      if (checkAvailability && !runner.isAvailable) {
        return res.status(403).json({ success: false, message: "You are currently offline. Go online to accept orders." })
      }
 
      req.runner = runner // attach runner to request for use in controllers
      next()
 
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message })
    }
  }
}
 
module.exports = onlyApprovedRunner