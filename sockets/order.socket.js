// ── sockets/order.socket.js ───────────────────────────
// FIX: was io.emit("order:update") — broadcasts order state to EVERY user
// Changed to emit only to the relevant order room
 
const { getIO } = require("../config/socket") // FIX: missing destructuring
 
exports.emitOrderUpdate = (order) => {
  try {
    const io = getIO()
    // Emit only to the participants of this specific order
    io.to(`order_${order._id}`).emit("order:update", order)
  } catch (error) {
    console.error("Order socket emit error:", error.message)
  }
}