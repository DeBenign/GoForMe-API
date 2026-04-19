// config/socket.js
const { Server } = require("socket.io")
const jwt = require("../utils/jwt")

let io

exports.initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  })

  // ── AUTH MIDDLEWARE ───────────────────────────────
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token
      if (!token) return next(new Error("No token provided"))

      const decoded = jwt.verify(token, process.env.JWT_SECRET)
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
    socket.on("chat:send", ({ orderId, message }) => {
      io.to(`order_${orderId}`).emit("chat:receive", {
        sender: socket.user.id,
        message,
        sentAt: new Date(),
      })
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