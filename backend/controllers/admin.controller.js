// controllers/admin.controller.js
const User = require("../models/User")
const Order = require("../models/Order")
const Runner = require("../models/Runner")
const { splitCommission } = require("../config/commission")

// ── GET ALL USERS ─────────────────────────────────────
const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password -otp -refreshToken")
    return res.json({ success: true, count: users.length, data: users })
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message })
  }
}

// ── GET ALL ORDERS ────────────────────────────────────
const getOrders = async (req, res) => {
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
const overrideOrder = async (req, res) => {
  try {
    const updates = { ...req.body }

    // FIX: overriding price without recomputing the commission split left
    // commissionAmount/runnerPayout pointing at the old price — the runner
    // could get paid (or the platform credited) an amount that no longer
    // matched what the customer was actually charged.
    if (updates.price !== undefined) {
      Object.assign(updates, splitCommission(Number(updates.price)))
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      updates,
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
const approveRunner = async (req, res) => {
  try {
    const runner = await Runner.findById(req.params.id)

    if (!runner) {
      return res.status(404).json({ success: false, message: "Runner not found" })
    }

    runner.status = "approved"
    runner.isAvailable = true
    await runner.save()

    // Role flip now happens here, at approval, not at application time
    // (see runner.controller.js createRunner — the flip used to live there)
    await User.findByIdAndUpdate(runner.user_id, { role: "runner" })

    return res.json({
      success: true,
      message: "Runner approved successfully",
      data: runner
    })

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message })
  }
}

// ── PROMOTE / CHANGE USER ROLE (admin only) ───────────
// Lets an existing admin grant or revoke admin/runner/customer roles
// without touching the database directly. Deliberately admin-only —
// gated by the same adminAuth middleware as every other route in this file.
const VALID_ROLES = ["customer", "runner", "admin"]

const promoteUser = async (req, res) => {
  try {
    const { role } = req.body
    const { id } = req.params

    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `role must be one of: ${VALID_ROLES.join(", ")}`
      })
    }

    // Prevent an admin from accidentally demoting themselves and getting
    // locked out — require a different admin to do it.
    if (id === req.user._id.toString() && role !== "admin") {
      return res.status(400).json({
        success: false,
        message: "You cannot change your own role. Ask another admin to do this."
      })
    }

    const user = await User.findByIdAndUpdate(id, { role }, { new: true })
      .select("-password -otp -refreshToken")

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" })
    }

    return res.json({
      success: true,
      message: `User role updated to ${role}`,
      data: user
    })

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message })
  }
}

// ── REJECT RUNNER ─────────────────────────────────────
const rejectRunner = async (req, res) => {
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

module.exports = { getUsers, getOrders, overrideOrder, approveRunner, rejectRunner, promoteUser }