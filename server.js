require("dotenv").config()

const express = require("express")
const cors = require("cors")
const http = require("http")
const { initSocket } = require("./config/socket")

const app = express()
const server = http.createServer(app)

// Initialize Socket
initSocket(server)

const connectDB = require("./config/db")

const authRoutes = require("./routes/auth.routes")
const userRoutes = require("./routes/user.routes")
const runnerRoutes = require("./routes/runner.routes")
const orderRoutes = require("./routes/order.routes")
const paymentRoutes = require("./routes/payment.routes")
const walletRoutes = require("./routes/wallet.routes")
const adminRoutes = require("./routes/admin.routes")
const payoutRoutes = require("./routes/payout.routes")
const chatRoutes    = require("./routes/chat.routes")
const disputeRoutes = require("./routes/dispute.routes")

// Connect database
connectDB().catch(err => {
  console.error("DB connection failed:", err)
  process.exit(1)
})


// Middlewares
app.use(cors())
app.use(express.json())

// Base URL
const BASE_URL = "/api/v1"

// Routes
app.use(`${BASE_URL}/auth`, authRoutes)
app.use(`${BASE_URL}/users`, userRoutes)
app.use(`${BASE_URL}/runners`, runnerRoutes)
app.use(`${BASE_URL}/orders`, orderRoutes)
app.use(`${BASE_URL}/payments`, paymentRoutes)
app.use(`${BASE_URL}/wallet`, walletRoutes)
app.use(`${BASE_URL}/admin`, adminRoutes)
app.use(`${BASE_URL}/payouts`, payoutRoutes)
app.use(`${BASE_URL}/chat`, chatRoutes)
app.use(`${BASE_URL}/disputes`, disputeRoutes)

// Health check
app.get("/", (req, res) => {
  res.json({
    status: "GoForMe API Running"
  })
})



//Server Port

const PORT = process.env.PORT || 5000

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
