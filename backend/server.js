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
const ratingRoutes = require("./routes/ratingRoutes")
const promoRoutes = require("./routes/promoRoutes")
const referralRoutes = require("./routes/referralRoutes")

// Connect database
connectDB().catch(err => {
  console.error("DB connection failed:", err)
  process.exit(1)
})


// Middlewares
// FIX: cors() with no options reflects any origin — locked down to an
// explicit allowlist. Set ALLOWED_ORIGINS in .env as a comma-separated list,
// e.g. "https://goforme-admin.vercel.app,https://goforme.app"
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:5173,http://localhost:5174,http://localhost:5175")
  .split(",")
  .map(o => o.trim())
  .filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (curl, Postman, server-to-server) which send no Origin header
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true)
    }
    console.warn(`CORS blocked request from origin: ${origin}`)
    return callback(new Error("Not allowed by CORS"))
  },
  credentials: true
}))

// Base URL
const BASE_URL = "/api/v1"

// FIX: the Paystack webhook route needs the exact raw request bytes to
// verify its signature (see payment.controller.js). express.json() below
// used to run globally FIRST, parse the body, and mark it consumed — so the
// route's own express.raw() middleware got nothing, and the webhook was
// verifying a re-serialized JSON.stringify() copy instead of Paystack's
// actual signed bytes. Skip the global JSON parser for that one path only;
// its router applies express.raw() itself.
// FIX: same issue as the payments webhook above — this route also needs
// raw bytes for its signature check (see payout.controller.js), so it must
// be excluded from the global JSON parser too.
app.use((req, res, next) => {
  if (req.originalUrl === `${BASE_URL}/payments/webhook` || req.originalUrl === `${BASE_URL}/payouts/webhook`) {
    return next()
  }
  return express.json()(req, res, next)
})

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
app.use(`${BASE_URL}/ratings`, ratingRoutes)
app.use(`${BASE_URL}/promos`, promoRoutes)
app.use(`${BASE_URL}/referrals`, referralRoutes)

// Health check
app.get("/", (req, res) => {
  res.json({
    status: "GoForMe API Running"
  })
})

// Global error handler — must be registered last, after all routes
const errorHandler = require("./middleware/error.middleware")
app.use(errorHandler)

//Server Port

const PORT = process.env.PORT || 5000

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})