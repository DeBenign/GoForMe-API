// controllers/dispute.controller.js

const Dispute = require("../models/Dispute")
const Order   = require("../models/Order")
const Wallet  = require("../models/Wallet")
const Runner  = require("../models/Runner")
const notificationService = require("../services/notification.service")

// ─────────────────────────────────────────────────────
//  @route   POST /api/v1/disputes
//  @desc    Customer or Runner raises a dispute on an order
//  @access  Private
// ─────────────────────────────────────────────────────
const createDispute = async (req, res) => {
  try {
    const { order_id, reason, description } = req.body

    if (!order_id || !reason || !description) {
      return res.status(400).json({
        success: false,
        message: "order_id, reason and description are required"
      })
    }

    const order = await Order.findById(order_id)
      .populate("user_id",   "name email phone")
      .populate("runner_id", "user_id")

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" })
    }

    // Only completed or cancelled orders can be disputed
    if (!["completed", "cancelled"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: "Disputes can only be raised on completed or cancelled orders"
      })
    }

    // Determine who the dispute is raised against
    const isCustomer = order.user_id._id.toString() === req.user._id.toString()
    let against

    if (isCustomer) {
      // Customer disputes against runner
      if (!order.runner_id) {
        return res.status(400).json({
          success: false,
          message: "No runner assigned to this order"
        })
      }
      against = order.runner_id.user_id
    } else {
      // Runner disputes against customer
      against = order.user_id._id
    }

    // Prevent duplicate disputes on same order by same user
    const existing = await Dispute.findOne({
      order_id,
      raised_by: req.user._id
    })

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "You have already raised a dispute for this order",
        disputeId: existing._id
      })
    }

    const dispute = await Dispute.create({
      order_id,
      raised_by  : req.user._id,
      against,
      reason,
      description
    })

    // Notify admin via notification service
    await notificationService.sendRealtimeNotification("admin", {
      type   : "new_dispute",
      message: `New dispute raised on order ${order_id}`,
      disputeId: dispute._id
    })

    return res.status(201).json({
      success: true,
      message: "Dispute raised successfully. Our team will review within 24 hours.",
      data   : dispute
    })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to raise dispute",
      error  : error.message
    })
  }
}

// ─────────────────────────────────────────────────────
//  @route   GET /api/v1/disputes
//  @desc    Get my disputes (customer or runner)
//  @access  Private
// ─────────────────────────────────────────────────────
const getMyDisputes = async (req, res) => {
  try {
    const disputes = await Dispute.find({ raised_by: req.user._id })
      .sort({ createdAt: -1 })
      .populate("order_id",   "description status price")
      .populate("raised_by",  "name email")
      .populate("against",    "name email")
      .populate("resolved_by","name")

    return res.json({
      success: true,
      count  : disputes.length,
      data   : disputes
    })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch disputes",
      error  : error.message
    })
  }
}

// ─────────────────────────────────────────────────────
//  @route   GET /api/v1/disputes/:id
//  @desc    Get single dispute detail
//  @access  Private
// ─────────────────────────────────────────────────────
const getDispute = async (req, res) => {
  try {
    const dispute = await Dispute.findById(req.params.id)
      .populate("order_id",   "description status price pickup_location dropoff_location")
      .populate("raised_by",  "name email phone")
      .populate("against",    "name email phone")
      .populate("resolved_by","name")

    if (!dispute) {
      return res.status(404).json({ success: false, message: "Dispute not found" })
    }

    // Only the parties involved or admin can view
    const isInvolved = (
      dispute.raised_by._id.toString() === req.user._id.toString() ||
      dispute.against._id.toString()   === req.user._id.toString()
    )

    if (!isInvolved && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied" })
    }

    return res.json({ success: true, data: dispute })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch dispute",
      error  : error.message
    })
  }
}

// ─────────────────────────────────────────────────────
//  @route   GET /api/v1/admin/disputes
//  @desc    Admin — get all disputes with filters
//  @access  Admin
// ─────────────────────────────────────────────────────
const getAllDisputes = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query
    const skip  = (parseInt(page) - 1) * parseInt(limit)
    const query = {}
    if (status) query.status = status

    const [disputes, total] = await Promise.all([
      Dispute.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("order_id",  "description price status")
        .populate("raised_by", "name email phone")
        .populate("against",   "name email phone"),
      Dispute.countDocuments(query)
    ])

    return res.json({
      success   : true,
      total,
      page      : parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data      : disputes
    })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch disputes",
      error  : error.message
    })
  }
}

// ─────────────────────────────────────────────────────
//  @route   PATCH /api/v1/admin/disputes/:id/resolve
//  @desc    Admin resolves a dispute
//  @access  Admin
// ─────────────────────────────────────────────────────
const resolveDispute = async (req, res) => {
  try {
    const { resolution, resolution_note, refund_amount } = req.body

    if (!resolution) {
      return res.status(400).json({ success: false, message: "Resolution is required" })
    }

    const dispute = await Dispute.findById(req.params.id)
      .populate("raised_by", "name email phone")
      .populate("order_id")

    if (!dispute) {
      return res.status(404).json({ success: false, message: "Dispute not found" })
    }

    if (dispute.status === "resolved") {
      return res.status(400).json({ success: false, message: "Dispute already resolved" })
    }

    // Handle refund if resolution includes one
    let finalResolutionNote = resolution_note || ""

    if (resolution === "refund_issued" && refund_amount > 0) {
      const wallet = await Wallet.findOne({ user_id: dispute.raised_by._id })

      if (wallet) {
        wallet.balance += refund_amount
        wallet.transactions.push({
          amount: refund_amount,
          type  : "credit",
          reason: `Dispute refund — order #${dispute.order_id?._id || dispute.order_id}`
        })
        await wallet.save()

        dispute.refund_amount = refund_amount
        dispute.refund_issued = true
      }

      // FIX: crediting the customer's wallet used to be the whole story —
      // but the runner's totalEarnings from this order was never touched,
      // so a refunded customer and a fully-paid runner both walked away
      // with money from the same errand, and the platform ate the loss
      // with no record of why. If this dispute is against a runner (i.e.
      // raised by the customer, not the runner disputing the customer),
      // claw back what that runner earned from this specific order — up to
      // what they actually earned and up to what they currently have, so
      // this can never push totalEarnings negative.
      const runner = await Runner.findOne({ user_id: dispute.against._id })
      if (runner) {
        const order = dispute.order_id
        const orderEarnings = order ? (order.itemBudget || 0) + (order.runnerPayout || 0) : 0
        const clawback = Math.min(refund_amount, orderEarnings, runner.totalEarnings)

        if (clawback > 0) {
          runner.totalEarnings -= clawback
          await runner.save()
        }

        // If the runner had already withdrawn the money (or the order
        // earnings don't cover the full refund), there's a shortfall the
        // platform is absorbing — surface it so an admin can follow up
        // (e.g. deduct from a future payout, or write it off deliberately)
        // rather than it silently disappearing.
        if (clawback < refund_amount) {
          finalResolutionNote =
            `${finalResolutionNote} [Clawback note: only ₦${clawback} of the ₦${refund_amount} refund could be recovered from the runner's earnings — ₦${refund_amount - clawback} shortfall needs manual follow-up.]`.trim()
        }
      }
    }

    // Update dispute
    dispute.status          = "resolved"
    dispute.resolution      = resolution
    dispute.resolution_note = finalResolutionNote
    dispute.resolved_by     = req.user._id
    dispute.resolved_at     = new Date()
    await dispute.save()

    // Notify the user who raised the dispute
    await notificationService.notifyUser({
      user   : dispute.raised_by,
      title  : "Your dispute has been resolved",
      message: `Resolution: ${resolution}. ${resolution_note || ""}${
        dispute.refund_issued ? ` ₦${refund_amount} has been credited to your wallet.` : ""
      }`
    })

    return res.json({
      success: true,
      message: "Dispute resolved successfully",
      data   : dispute
    })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to resolve dispute",
      error  : error.message
    })
  }
}

// ─────────────────────────────────────────────────────
//  @route   PATCH /api/v1/admin/disputes/:id/status
//  @desc    Admin updates dispute status (e.g. open → under_review)
//  @access  Admin
// ─────────────────────────────────────────────────────
const updateDisputeStatus = async (req, res) => {
  try {
    const { status } = req.body
    const allowed    = ["open", "under_review", "closed"]

    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${allowed.join(", ")}`
      })
    }

    const dispute = await Dispute.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )

    if (!dispute) {
      return res.status(404).json({ success: false, message: "Dispute not found" })
    }

    return res.json({ success: true, data: dispute })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update dispute status",
      error  : error.message
    })
  }
}

module.exports = {
  createDispute,
  getMyDisputes,
  getDispute,
  getAllDisputes,
  resolveDispute,
  updateDisputeStatus
}