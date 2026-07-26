// controllers/wallet.controller.js
const Wallet = require("../models/Wallet")
const User = require("../models/User")
const { initializePayment } = require("../services/payment.service")
const { creditWalletForReference } = require("../services/wallet.service")

// ── FUND WALLET (initialize payment) ─────────────────
const fundWallet = async (req, res) => {
  try {
    const { amount } = req.body

    // FIX: use req.user._id from auth middleware — never trust user_id from body
    // Anyone could pass any user_id and fund a different user's wallet
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "A valid amount is required"
      })
    }

    const user = await User.findById(req.user._id)
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" })
    }

    // Send the user back to the customer web app's wallet page after paying,
    // so the frontend can pick up ?reference= and call /wallet/verify.
    //
    // FIX (root cause of "top-up not adding"): this used to ONLY work if
    // CUSTOMER_APP_URL was set in .env. If that var was ever missing/unset —
    // which it was — callback_url came back undefined, Paystack fell back to
    // its own generic "payment complete" page, the app was never reopened,
    // /wallet/verify never got called, and the balance never updated even
    // though the money left the customer's card/test account.
    //
    // Now we prefer CUSTOMER_APP_URL when it's set (correct for production,
    // where the request Origin may be stripped by some redirects), but fall
    // back to the Origin/Referer header of the request that's actually
    // calling us — so it also works out of the box in local dev without any
    // env var at all.
    const originHeader =
      req.get("origin") ||
      (req.get("referer") ? new URL(req.get("referer")).origin : null)

    const appOrigin = (process.env.CUSTOMER_APP_URL || originHeader || "").replace(/\/$/, "")
    const callbackUrl = appOrigin ? `${appOrigin}/wallet` : undefined

    const payment = await initializePayment(user.email, amount, callbackUrl)

    return res.json({ success: true, data: payment.data })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to initialize payment",
      error: error.message
    })
  }
}

// ── VERIFY WALLET FUNDING (after Paystack redirect) ───
const verifyWalletFunding = async (req, res) => {
  try {
    const { reference } = req.query

    if (!reference) {
      return res.status(400).json({ success: false, message: "Payment reference is required" })
    }

    const result = await creditWalletForReference(reference)

    if (!result.credited && !result.alreadyCredited) {
      return res.status(400).json({ success: false, message: result.reason })
    }

    return res.json({
      success: true,
      message: result.alreadyCredited ? "Wallet already funded for this payment" : "Wallet funded successfully",
      balance: result.balance
    })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to verify payment",
      error: error.message
    })
  }
}

// ── GET MY WALLET (logged in user) ───────────────────
const getMyWallet = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ user_id: req.user._id })

    if (!wallet) {
      return res.status(404).json({ success: false, message: "Wallet not found" })
    }

    return res.json({ success: true, data: wallet })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch wallet",
      error: error.message
    })
  }
}

// ── GET ALL WALLETS (admin only) ──────────────────────
const getWallets = async (req, res) => {
  try {
    const { user_id } = req.query
    const query = user_id ? { user_id } : {}
    const wallets = await Wallet.find(query).populate("user_id", "name email")

    return res.status(200).json({
      success: true,
      count: wallets.length,
      data: wallets
    })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch wallets",
      error: error.message
    })
  }
}

// ── GET SINGLE WALLET BY ID (admin) ──────────────────
const getWallet = async (req, res) => {
  try {
    const wallet = await Wallet.findById(req.params.id).populate("user_id", "name email phone")

    if (!wallet) {
      return res.status(404).json({ success: false, message: "Wallet not found" })
    }

    return res.status(200).json({ success: true, data: wallet })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching wallet",
      error: error.message
    })
  }
}

module.exports = { fundWallet, verifyWalletFunding, getMyWallet, getWallets, getWallet }