// controllers/payment.controller.js
const paymentService = require("../services/payment.service")
const { creditWalletForReference } = require("../services/wallet.service")

// ── INITIALIZE PAYMENT ────────────────────────────────
const initializePayment = async (req, res) => {
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
const verifyPayment = async (req, res) => {
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
// This is the safety net for wallet top-ups: if the customer closes the tab,
// loses connectivity, or their bank's own redirect drops the callback_url,
// the frontend's /wallet/verify call never happens. Paystack still calls
// this server-to-server, so we credit the wallet from here too.
// creditWalletForReference dedupes on reference, so it's harmless if
// /wallet/verify already credited it — this only fills the gap when it didn't.
const webhook = async (req, res) => {
  try {
    const signature = req.headers["x-paystack-signature"]
    // req.body is the raw Buffer here (see server.js — this route is
    // excluded from the global express.json() parser so the signature check
    // below sees Paystack's exact bytes, not a re-serialized copy)
    const event = JSON.parse(req.body.toString("utf8"))

    const isValid = paymentService.verifyWebhookSignature(req.body, signature)
    if (!isValid) {
      console.warn("Paystack webhook: invalid signature, ignoring")
      return res.sendStatus(200)
    }

    if (event.event === "charge.success") {
      const reference = event.data.reference
      const result = await creditWalletForReference(reference)
      if (result.credited) {
        console.log(`Webhook credited wallet for reference ${reference}`)
      }
    }

    // Always return 200 to Paystack immediately
    return res.sendStatus(200)

  } catch (error) {
    console.error("Webhook error:", error.message)
    return res.sendStatus(200) // Still 200 — never let Paystack retry endlessly
  }
}

module.exports = { initializePayment, verifyPayment, webhook }