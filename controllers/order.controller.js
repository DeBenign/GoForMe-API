// controllers/order.controller.js
const Order = require("../models/Order")
const Runner = require("../models/Runner")
const Wallet  = require("../models/Wallet")
const matchingService = require("../services/matching.service")
const { getIO } = require("../config/socket") // FIX: was missing destructuring

// ── CREATE ORDER + AUTO MATCH ─────────────────────────
const createOrder = async (req, res) => {
  try {
    const { pickup_location, dropoff_location, description, price } = req.body

    if (!pickup_location || !price) {
      return res.status(400).json({
        success: false,
        message: "Pickup location and price are required"
      })
    }

    // ── WALLET BALANCE CHECK ──────────────────────────
    const wallet = await Wallet.findOne({ user_id: req.user._id })

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found. Please fund your wallet before placing an order."
      })
    }

    const MINIMUM_BALANCE = 100 // ₦100 minimum

    if (wallet.balance < MINIMUM_BALANCE) {
      return res.status(400).json({
        success: false,
        message: `Insufficient wallet balance. Minimum ₦${MINIMUM_BALANCE} required to place an order.`,
        currentBalance: wallet.balance,
        required      : MINIMUM_BALANCE
      })
    }

    // ── Also check wallet can cover the order price ───
    if (wallet.balance < price) {
      return res.status(400).json({
        success: false,
        message: `Insufficient wallet balance to cover this order.`,
        currentBalance: wallet.balance,
        orderPrice    : price,
        shortfall     : price - wallet.balance
      })
    }

    // ── Deduct order price from wallet ────────────────
    wallet.balance -= price
    await wallet.save()

    // ── Create the order ──────────────────────────────
    let order = await Order.create({
      user_id: req.user._id,
      pickup_location,
      dropoff_location,
      description,
      price,
      status: "pending"
    })

    // Auto-match nearest available runner
    const runner = await matchingService.matchRunnerToOrder(order)

    if (runner) {
      order.runner_id = runner._id
      order.status = "accepted"

      // Mark runner unavailable while on a job
      runner.isAvailable = false
      await runner.save()
      await order.save()

      // Notify runner via socket
      const io = getIO()
      io.to(`user_${runner.user_id}`).emit("newOrder", {
        message: "New order assigned to you",
        order
      })
    }

    return res.status(201).json({
      success: true,
      message: runner ? "Order created and runner matched" : "Order created. Searching for a runner...",
      data: order
    })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create order",
      error: error.message
    })
  }
}

// ── GET ALL ORDERS (for current user) ────────────────
const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user_id: req.user._id })
      .sort({ createdAt: -1 })
      .populate("runner_id", "user_id location")

    return res.json({ success: true, count: orders.length, data: orders })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message
    })
  }
}

// ── GET SINGLE ORDER ──────────────────────────────────
const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("runner_id")
      .populate("user_id", "name phone")

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" })
    }

    return res.json({ success: true, data: order })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch order",
      error: error.message
    })
  }
}

// ── ACCEPT ORDER (runner confirms) ───────────────────
const acceptOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" })
    }

    // FIX: use req.user._id — middleware sets req.user not req.runner
    const runner = await Runner.findOne({ user_id: req.user._id })
    if (!runner || order.runner_id.toString() !== runner._id.toString()) {
      return res.status(403).json({ success: false, message: "Not your order" })
    }

    order.status = "accepted"
    await order.save()

    return res.json({ success: true, data: order })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to accept order",
      error: error.message
    })
  }
}

// ── START ORDER (runner picks up) ────────────────────
const startOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" })
    }

    // FIX: use req.user._id consistently
    const runner = await Runner.findOne({ user_id: req.user._id })
    if (!runner || order.runner_id.toString() !== runner._id.toString()) {
      return res.status(403).json({ success: false, message: "Not your order" })
    }

    order.status = "in_progress"
    await order.save()

    const io = getIO()
    io.to(`order_${order._id}`).emit("orderStarted", {
      orderId: order._id,
      status: "in_progress"
    })

    return res.json({ success: true, data: order })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to start order",
      error: error.message
    })
  }
}

// ── COMPLETE ORDER ────────────────────────────────────
const completeOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" })
    }

    // FIX: use req.user._id consistently
    const runner = await Runner.findOne({ user_id: req.user._id })
    if (!runner || order.runner_id.toString() !== runner._id.toString()) {
      return res.status(403).json({ success: false, message: "Not your order" })
    }

    order.status = "completed"
    order.completedAt = new Date()
    await order.save()

    // Update runner earnings and free them up
    runner.totalEarnings += order.price
    runner.completedJobs += 1
    runner.isAvailable = true // Back online after completing job
    runner.currentOrder = null
    await runner.save()

    const io = getIO()
    io.to(`order_${order._id}`).emit("orderCompleted", {
      orderId: order._id,
      message: "Order completed successfully"
    })

    return res.json({
      success: true,
      message: "Order completed",
      data: order
    })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to complete order",
      error: error.message
    })
  }
}

// ── CANCEL ORDER ──────────────────────────────────────
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" })
    }

    if (!["pending", "accepted"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel an order that is already "${order.status}"`
      })
    }

    order.status = "cancelled"
    order.cancelledAt = new Date()
    await order.save()

    // Free the runner if one was assigned
    if (order.runner_id) {
      await Runner.findByIdAndUpdate(order.runner_id, { isAvailable: true })
    }

    return res.json({ success: true, message: "Order cancelled" })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to cancel order",
      error: error.message
    })
  }
}

module.exports = {
  createOrder,
  getOrders,
  getOrder,
  acceptOrder,
  startOrder,
  completeOrder,
  cancelOrder
}