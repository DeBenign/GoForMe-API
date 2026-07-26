const Order  = require("../models/Order")
const Runner = require("../models/Runner")
const Wallet = require("../models/Wallet")
const Rating = require("../models/Rating")
const matchingService = require("../services/matching.service")
const { getIO } = require("../config/socket")
const { computeDiscount, recordRedemption } = require("./promoController")
const { tryQualifyReferralOnOrderComplete } = require("./referralController")
const { splitCommission } = require("../config/commission")
const { computeErrandFee } = require("../config/errandFee")
 
// ── CREATE ORDER + AUTO MATCH ─────────────────────────
const createOrder = async (req, res) => {
  try {
    // FIX (root cause of "errand fee not included"): `price` used to be the
    // ENTIRE charge, decided by the customer, and 15% of that whole amount
    // was taken as commission — including money meant to buy the customer's
    // groceries/meds. That shortchanged the runner on both the reimbursement
    // for what they spent AND their pay for the trip. Now the customer sets
    // `itemBudget` (cash the runner spends on their behalf, reimbursed in
    // full), and the errand fee — the runner's service charge — is
    // calculated automatically from the pickup→drop-off distance. Only the
    // errand fee is commissioned.
    const { title, pickup_location, dropoff_location, description, itemBudget, category, promoCode } = req.body

    if (!pickup_location || itemBudget === undefined || itemBudget === null) {
      return res.status(400).json({
        success: false,
        message: "Pickup location and item budget are required"
      })
    }

    const VALID_CATEGORIES = ["grocery", "pharmacy", "document", "food", "bank", "office", "other"]
    if (category && !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Category must be one of: ${VALID_CATEGORIES.join(", ")}`
      })
    }

    const { distanceKm, errandFee } = computeErrandFee(pickup_location, dropoff_location)
    const price = Number(itemBudget) + errandFee

    // Promo code (optional) — validated before wallet deduction so the
    // discounted amount, not the sticker price, is what actually gets charged.
    let chargeAmount = price
    let appliedPromo = null
    if (promoCode) {
      try {
        const { promo, discount } = await computeDiscount(promoCode, req.user._id, price)
        appliedPromo = promo
        chargeAmount = price - discount
      } catch (err) {
        return res.status(err.status || 400).json({
          success: false,
          message: err.message || "Invalid promo code"
        })
      }
    }

    const wallet = await Wallet.findOne({ user_id: req.user._id })
 
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found. Please fund your wallet before placing an order."
      })
    }
 
    const MINIMUM_BALANCE = 100
 
    if (wallet.balance < MINIMUM_BALANCE) {
      return res.status(400).json({
        success: false,
        message: `Insufficient wallet balance. Minimum ₦${MINIMUM_BALANCE} required.`,
        currentBalance: wallet.balance,
        required      : MINIMUM_BALANCE
      })
    }
 
    if (wallet.balance < chargeAmount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance to cover this order.",
        currentBalance: wallet.balance,
        orderPrice    : chargeAmount,
        shortfall     : chargeAmount - wallet.balance
      })
    }
 
    wallet.balance -= chargeAmount
    wallet.transactions.push({
      amount: chargeAmount,
      type  : "debit",
      reason: appliedPromo ? `Errand payment (promo ${appliedPromo.code} applied)` : "Errand payment"
    })
    await wallet.save()

    // A promo discount comes out of the errand fee, never the item budget —
    // the runner must always be reimbursed in full for what they actually
    // spend on the customer's behalf, discount or not.
    const discount = price - chargeAmount
    const discountedErrandFee = Math.max(0, errandFee - discount)

    let order = await Order.create({
      user_id: req.user._id,
      title,
      pickup_location,
      dropoff_location,
      description,
      price: chargeAmount,
      itemBudget: Number(itemBudget),
      errandFee: discountedErrandFee,
      distanceKm,
      category,
      status: "pending",
      ...splitCommission(discountedErrandFee)
    })

    if (appliedPromo) {
      await recordRedemption(appliedPromo, req.user._id, order._id, price - chargeAmount)
    }
 
    const runner = await matchingService.matchRunnerToOrder(order)
 
    if (runner) {
      order.runner_id    = runner._id
      order.status       = "accepted"
      runner.isAvailable = false
      await runner.save()
      await order.save()
 
      const io = getIO()
      io.to(`user_${runner.user_id}`).emit("newOrder", {
        message: "New order assigned to you",
        order
      })
    }
 
    return res.status(201).json({
      success      : true,
      message      : runner
        ? "Order created and runner matched"
        : "Order created. Searching for a runner...",
      data         : order,
      walletBalance: wallet.balance  // always return updated balance
    })
 
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create order",
      error  : error.message
    })
  }
}
 
// ── GET ALL ORDERS ────────────────────────────────────
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
      error  : error.message
    })
  }
}
 
// ── GET MY ORDERS AS A RUNNER ─────────────────────────
// ADDED: there was no way for a runner to see the errands assigned to them —
// getOrders above only ever filters by user_id (the customer who placed it).
// Needed by the mobile app's runner dashboard/earnings screens.
const getRunnerOrders = async (req, res) => {
  try {
    const runner = await Runner.findOne({ user_id: req.user._id })
    if (!runner) {
      return res.status(403).json({ success: false, message: "Runner profile not found" })
    }

    const orders = await Order.find({ runner_id: runner._id })
      .sort({ createdAt: -1 })
      .populate("user_id", "name phone")

    return res.json({ success: true, count: orders.length, data: orders })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch your assigned errands",
      error  : error.message
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

    // So the frontend knows whether to show the "rate this errand" form or
    // a thank-you state, without a separate round trip per order.
    const orderObj = order.toObject()
    if (order.status === "completed") {
      orderObj.ratedByMe = !!(await Rating.exists({ order: order._id, rater: req.user._id }))
    }

    return res.json({ success: true, data: orderObj })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch order",
      error  : error.message
    })
  }
}
 
// ── ACCEPT ORDER ──────────────────────────────────────
const acceptOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" })
    }
 
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
      error  : error.message
    })
  }
}
 
// ── START ORDER ───────────────────────────────────────
const startOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" })
    }
 
    const runner = await Runner.findOne({ user_id: req.user._id })
    if (!runner || order.runner_id.toString() !== runner._id.toString()) {
      return res.status(403).json({ success: false, message: "Not your order" })
    }
 
    order.status = "in_progress"
    await order.save()
 
    const io = getIO()
    io.to(`order_${order._id}`).emit("orderStarted", {
      orderId: order._id,
      status : "in_progress"
    })
 
    return res.json({ success: true, data: order })
 
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to start order",
      error  : error.message
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
 
    const runner = await Runner.findOne({ user_id: req.user._id })
    if (!runner || order.runner_id.toString() !== runner._id.toString()) {
      return res.status(403).json({ success: false, message: "Not your order" })
    }
 
    order.status      = "completed"
    order.completedAt = new Date()
    await order.save()
 
    // FIX: runner used to be paid the full order.price with zero commission
    // taken — the platform captured ₦0 revenue on every completed errand.
    // FIX: this used to only credit runnerPayout, which — now that
    // runnerPayout is just the runner's cut of the errand FEE — would have
    // left the runner unreimbursed for the item budget they actually spent
    // at the store. Runners must receive itemBudget in full, plus their
    // share of the errand fee. The `|| order.price` fallback only covers
    // orders created before this split existed.
    runner.totalEarnings += ((order.itemBudget || 0) + order.runnerPayout) || order.price
    runner.completedJobs += 1
    runner.isAvailable    = true
    runner.currentOrder   = null
    await runner.save()

    // Referral reward check — no-op unless this customer was referred and
    // this is their first-ever completed order.
    await tryQualifyReferralOnOrderComplete(order.user_id, order._id)
 
    const io = getIO()
    io.to(`order_${order._id}`).emit("orderCompleted", {
      orderId: order._id,
      message: "Order completed successfully"
    })
 
    return res.json({ success: true, message: "Order completed", data: order })
 
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to complete order",
      error  : error.message
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
 
    order.status      = "cancelled"
    order.cancelledAt = new Date()
    await order.save()
 
    // Free the runner
    if (order.runner_id) {
      await Runner.findByIdAndUpdate(order.runner_id, { isAvailable: true })
    }
 
    // FIX B: refund the customer's wallet — money was deducted on create,
    // must be returned on cancel or the customer loses it permanently
    const wallet = await Wallet.findOne({ user_id: order.user_id })
    if (wallet) {
      wallet.balance += order.price
      wallet.transactions.push({
        amount: order.price,
        type  : "credit",
        reason: `Refund — cancelled order #${order._id}`
      })
      await wallet.save()
    }
 
    return res.json({
      success      : true,
      message      : "Order cancelled. Your wallet has been refunded.",
      refunded     : order.price,
      walletBalance: wallet ? wallet.balance : null
    })
 
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to cancel order",
      error  : error.message
    })
  }
}
 
// ── DECLINE ORDER (runner) ────────────────────────────
// A runner can only decline while the errand is still fresh ("accepted",
// i.e. just auto-matched, before they've started it). Frees this runner,
// records them in declinedBy so they're not offered the same errand again,
// and re-runs matching to find the next-nearest available runner.
const declineOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" })
    }

    const runner = await Runner.findOne({ user_id: req.user._id })
    if (!runner || !order.runner_id || order.runner_id.toString() !== runner._id.toString()) {
      return res.status(403).json({ success: false, message: "Not your order" })
    }

    if (order.status !== "accepted") {
      return res.status(400).json({
        success: false,
        message: `Cannot decline an errand that is already "${order.status}"`
      })
    }

    runner.isAvailable = true
    await runner.save()

    order.declinedBy.push(runner._id)
    order.runner_id = null
    order.status    = "pending"
    await order.save()

    const nextRunner = await matchingService.matchRunnerToOrder(order)

    if (nextRunner) {
      order.runner_id    = nextRunner._id
      order.status       = "accepted"
      nextRunner.isAvailable = false
      await nextRunner.save()
      await order.save()

      const io = getIO()
      io.to(`user_${nextRunner.user_id}`).emit("newOrder", {
        message: "New order assigned to you",
        order
      })
    }

    return res.json({
      success: true,
      message: nextRunner
        ? "Declined — reassigned to another runner"
        : "Declined — searching for another runner",
      data: order
    })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to decline order",
      error  : error.message
    })
  }
}

module.exports = {
  createOrder,
  getOrders,
  getRunnerOrders,
  getOrder,
  acceptOrder,
  startOrder,
  completeOrder,
  declineOrder,
  cancelOrder
}