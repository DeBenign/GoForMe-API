// controllers/admin.controller.js
const User = require("../models/User")
const Order = require("../models/Order")
const Runner = require("../models/Runner")

// ── GET ALL USERS ─────────────────────────────────────
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password -otp -refreshToken")
    return res.json({ success: true, count: users.length, data: users })
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message })
  }
}

// ── GET ALL ORDERS ────────────────────────────────────
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user_id", "name email")
      .populate("runner_id")
      .sort({ createdAt: -1 })
    return res.json({ success: true, count: orders.length, data: orders })
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message })
  }
}

// ── OVERRIDE ORDER (admin edit) ───────────────────────
exports.overrideOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" })
    }

    return res.json({ success: true, data: order })
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message })
  }
}

// ── APPROVE RUNNER ────────────────────────────────────
exports.approveRunner = async (req, res) => {
  try {
    const runner = await Runner.findById(req.params.id)

    if (!runner) {
      return res.status(404).json({ success: false, message: "Runner not found" })
    }

    runner.status = "approved"
    runner.isAvailable = true
    await runner.save()

    return res.json({
      success: true,
      message: "Runner approved successfully",
      data: runner
    })

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message })
  }
}

// ── REJECT RUNNER ─────────────────────────────────────
exports.rejectRunner = async (req, res) => {
  try {
    const runner = await Runner.findById(req.params.id)

    if (!runner) {
      return res.status(404).json({ success: false, message: "Runner not found" })
    }

    runner.status = "rejected"
    runner.isAvailable = false
    await runner.save()

    // Revert user role back to customer
    await User.findByIdAndUpdate(runner.user_id, { role: "customer" })

    return res.json({ success: true, message: "Runner rejected" })

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message })
  }
}