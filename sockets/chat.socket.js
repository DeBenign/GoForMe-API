// ── sockets/chat.socket.js ────────────────────────────
const Message = require("../models/Message")
 
module.exports = (io) => {
  io.on("connection", (socket) => {
 
    // FIX: CRITICAL — was io.emit("chat:receive") which broadcasts to ALL connected users
    // Every chat message was visible to every user on the platform
    // Fixed to only emit within the specific order room
    socket.on("chat:send", async (data) => {
      const { orderId, content, receiverId } = data
 
      if (!orderId || !content) return
 
      try {
        const msg = await Message.create({
          sender_id  : socket.user.id,  // set by socket auth middleware
          receiver_id: receiverId,
          order_id   : orderId,
          content                        // FIX: schema uses "content" not "message"
        })
 
        // Emit ONLY to the order room — not to everyone
        io.to(`order_${orderId}`).emit("chat:receive", msg)
 
      } catch (error) {
        console.error("Chat save error:", error.message)
        socket.emit("chat:error", { message: "Failed to send message" })
      }
    })
 
  })
}