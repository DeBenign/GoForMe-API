// ── services/order.service.js ─────────────────────────
// ✅ Clean — no changes needed
 
const Order = require("../models/Order")
 
exports.assignRunner = async (orderId, runnerId) => {
  return await Order.findByIdAndUpdate(
    orderId,
    { runner_id: runnerId, status: "accepted" },
    { new: true }
  )
}