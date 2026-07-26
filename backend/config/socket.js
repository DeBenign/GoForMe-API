// config/socket.js
const { Server } = require("socket.io")
const jwt = require("../utils/jwt")
const Message = require("../models/Message")

let io

// FIX: this default was missing port 5175 (the runner app) — with
// ALLOWED_ORIGINS unset, the REST API allowed all three local frontends but
// the Socket.IO server silently rejected the runner app's websocket
// connection. Kept in sync with server.js's default list.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:5173,http://localhost:5174,http://localhost:5175")
  .split(",")
  .map(o => o.trim())
  .filter(Boolean)

exports.initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
    },
  })

  // ── AUTH MIDDLEWARE ───────────────────────────────
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token
      if (!token) return next(new Error("No token provided"))

      // FIX (root cause of chat + live updates not working at all): this
      // called jwt.verify(token, secret), but `jwt` here is
      // utils/jwt.js's { generateToken, verifyToken } wrapper — it has no
      // .verify() method. Every handshake threw inside this try block and
      // fell into the catch below, so EVERY socket connection was silently
      // rejected with "Unauthorized" — chat:send/order:join/live location
      // updates never worked for anyone, on either side of a chat.
      const decoded = jwt.verifyToken(token)
      socket.user = decoded
      next()
    } catch (err) {
      next(new Error("Unauthorized"))
    }
  })

  io.on("connection", (socket) => {
    console.log(`🔌 User connected: ${socket.user.id}`)

    // Join personal room for direct notifications
    socket.join(`user_${socket.user.id}`)

    // ── JOIN ORDER ROOM (customer + runner) ───────────
    socket.on("order:join", ({ orderId }) => {
      socket.join(`order_${orderId}`)
      console.log(`📦 User ${socket.user.id} joined order room: ${orderId}`)
    })

    // ── RUNNER LOCATION UPDATE ────────────────────────
    socket.on("runner:updateLocation", ({ orderId, lat, lng }) => {
      io.to(`order_${orderId}`).emit("order:locationUpdate", {
        lat,
        lng,
        updatedAt: new Date(),
      })
    })

    // ── CHAT ──────────────────────────────────────────
    socket.on("chat:send", async ({ orderId, content, receiverId }) => {
      if (!orderId || !content) return

      try {
        const msg = await Message.create({
          sender_id  : socket.user.id,
          receiver_id: receiverId,
          order_id   : orderId,
          content
        })

        io.to(`order_${orderId}`).emit("chat:receive", msg)
      } catch (error) {
        console.error("Chat save error:", error.message)
        socket.emit("chat:error", { message: "Failed to send message" })
      }
    })

    // ── DISCONNECT ────────────────────────────────────
    socket.on("disconnect", () => {
      console.log(`🔌 User disconnected: ${socket.user.id}`)
    })
  })
}

exports.getIO = () => {
  if (!io) throw new Error("Socket.IO not initialized")
  return io
}