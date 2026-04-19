// controllers/wallet.controller.js
const Wallet = require("../models/Wallet")
const User = require("../models/User")
const { initializePayment, verifyPayment } = require("../services/payment.service")

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

    const payment = await initializePayment(user.email, amount)

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

    const response = await verifyPayment(reference)

    if (response.data.status !== "success") {
      return res.status(400).json({
        success: false,
        message: "Payment was not successful",
        status: response.data.status
      })
    }

    const amount = response.data.amount / 100 // Convert kobo to naira
    const email  = response.data.customer.email

    // FIX: added null check — findOne can return null if email not found
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found for this payment" })
    }

    // FIX: added null check — wallet might not exist
    const wallet = await Wallet.findOne({ user_id: user._id })
    if (!wallet) {
      return res.status(404).json({ success: false, message: "Wallet not found" })
    }

    wallet.balance += amount
    await wallet.save()

    return res.json({
      success: true,
      message: "Wallet funded successfully",
      balance: wallet.balance
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
    const wallets = await Wallet.find().populate("user_id", "name email")

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