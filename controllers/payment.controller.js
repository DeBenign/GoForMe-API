// controllers/payment.controller.js
const paymentService = require("../services/payment.service")

// ── INITIALIZE PAYMENT ────────────────────────────────
exports.initializePayment = async (req, res) => {
  try {
    const { email, amount } = req.body

    if (!email || !amount) {
      return res.status(400).json({
        success: false,
        message: "Email and amount are required"
      })
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than 0"
      })
    }

    const payment = await paymentService.initializePayment(email, amount)

    return res.json({ success: true, data: payment })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Payment initialization failed",
      error: error.message
    })
  }
}

// ── VERIFY PAYMENT (Paystack callback) ────────────────
exports.verifyPayment = async (req, res) => {
  try {
    const { reference } = req.params

    if (!reference) {
      return res.status(400).json({ success: false, message: "Reference is required" })
    }

    const result = await paymentService.verifyPayment(reference)

    return res.json({ success: true, data: result })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Payment verification failed",
      error: error.message
    })
  }
}

// ── PAYSTACK WEBHOOK ──────────────────────────────────
exports.webhook = async (req, res) => {
  try {
    const signature = req.headers["x-paystack-signature"]
    await paymentService.handleWebhook(req.body, signature)

    // Always return 200 to Paystack immediately
    return res.sendStatus(200)

  } catch (error) {
    console.error("Webhook error:", error.message)
    return res.sendStatus(200) // Still 200 — never let Paystack retry endlessly
  }
}