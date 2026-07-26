// controllers/payout.controller.js
const Runner  = require("../models/Runner")
const Payout  = require("../models/Payout")
const User    = require("../models/User")
const paystack = require("../config/paystack")
const notificationService = require("../services/notification.service")

const MIN_PAYOUT = 500 // ₦500 minimum

// ── Generate unique payout reference ─────────────────
const generateRef = () => {
  const ts  = Date.now().toString(36).toUpperCase()
  const rnd = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `GFM-PAY-${ts}-${rnd}`
}

// ─────────────────────────────────────────────────────
//  @route   GET /api/v1/payouts/banks
//  @desc    List all supported Nigerian banks
//  @access  Private
// ─────────────────────────────────────────────────────
const getBanks = async (req, res) => {
  try {
    const response = await paystack.get("/bank?currency=NGN&country=nigeria&perPage=100")

    return res.json({
      success: true,
      data   : response.data.data
    })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch banks",
      error  : error.message
    })
  }
}

// ─────────────────────────────────────────────────────
//  @route   POST /api/v1/payouts/verify-account
//  @desc    Verify bank account number before saving
//  @access  Private — Runner
// ─────────────────────────────────────────────────────
const verifyAccount = async (req, res) => {
  try {
    const { account_number, bank_code } = req.body

    if (!account_number || !bank_code) {
      return res.status(400).json({
        success: false,
        message: "account_number and bank_code are required"
      })
    }

    const response = await paystack.get(
      `/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`
    )

    if (!response.data.status) {
      return res.status(400).json({
        success: false,
        message: "Could not verify account. Check the details and try again."
      })
    }

    return res.json({
      success       : true,
      account_name  : response.data.data.account_name,
      account_number: response.data.data.account_number
    })

  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Invalid account details",
      error  : error.response?.data?.message || error.message
    })
  }
}

// ─────────────────────────────────────────────────────
//  @route   POST /api/v1/payouts/save-bank
//  @desc    Save bank details + create Paystack recipient
//  @access  Private — Runner
// ─────────────────────────────────────────────────────
const saveBankDetails = async (req, res) => {
  try {
    const { account_number, bank_code, bank_name, account_name } = req.body

    if (!account_number || !bank_code || !bank_name || !account_name) {
      return res.status(400).json({
        success: false,
        message: "account_number, bank_code, bank_name and account_name are required"
      })
    }

    const runner = await Runner.findOne({ user_id: req.user._id })
    if (!runner) {
      return res.status(404).json({ success: false, message: "Runner profile not found" })
    }

    // Create Paystack transfer recipient
    const recipientRes = await paystack.post("/transferrecipient", {
      type          : "nuban",
      name          : account_name,
      account_number,
      bank_code,
      currency      : "NGN"
    })

    if (!recipientRes.data.status) {
      return res.status(400).json({
        success: false,
        message: "Failed to register bank with payment provider"
      })
    }

    const recipient_code = recipientRes.data.data.recipient_code

    runner.bank_details = {
      account_number,
      bank_code,
      bank_name,
      account_name,
      recipient_code
    }

    await runner.save()

    return res.json({
      success: true,
      message: "Bank details saved successfully",
      data   : {
        account_name,
        account_number,
        bank_name,
        recipient_code
      }
    })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to save bank details",
      error  : error.message
    })
  }
}

// ─────────────────────────────────────────────────────
//  @route   POST /api/v1/payouts/request
//  @desc    Runner requests a payout withdrawal
//  @access  Private — Runner
// ─────────────────────────────────────────────────────
const requestPayout = async (req, res) => {
  try {
    const { amount } = req.body

    if (!amount || amount < MIN_PAYOUT) {
      return res.status(400).json({
        success: false,
        message: `Minimum payout amount is ₦${MIN_PAYOUT}`
      })
    }

    const runner = await Runner.findOne({ user_id: req.user._id })
    if (!runner) {
      return res.status(404).json({ success: false, message: "Runner profile not found" })
    }

    if (runner.status !== "approved") {
      return res.status(403).json({
        success: false,
        message: "Only approved runners can request payouts"
      })
    }

    if (!runner.bank_details?.recipient_code) {
      return res.status(400).json({
        success: false,
        message: "Please save your bank details before requesting a payout"
      })
    }

    if (runner.totalEarnings < amount) {
      return res.status(400).json({
        success : false,
        message : "Insufficient earnings balance",
        available: runner.totalEarnings,
        requested: amount
      })
    }

    // Block if a pending payout already exists
    const pendingPayout = await Payout.findOne({
      runner_id: runner._id,
      status   : "pending"
    })

    if (pendingPayout) {
      return res.status(400).json({
        success: false,
        message: "You already have a pending payout. Wait for it to complete first."
      })
    }

    const reference = generateRef()

    // Deduct from earnings immediately (hold funds)
    runner.totalEarnings -= amount
    await runner.save()

    // Create payout record
    const payout = await Payout.create({
      runner_id     : runner._id,
      user_id       : req.user._id,
      amount,
      reference,
      recipient_code: runner.bank_details.recipient_code,
      bank_name     : runner.bank_details.bank_name,
      account_number: runner.bank_details.account_number,
      account_name  : runner.bank_details.account_name,
      status        : "pending"
    })

    // Initiate Paystack bank transfer
    try {
      const transferRes = await paystack.post("/transfer", {
        source   : "balance",
        amount   : amount * 100, // convert to kobo
        recipient: runner.bank_details.recipient_code,
        reference,
        reason   : `GoForMe runner payout — ${runner.bank_details.account_name}`
      })

      if (transferRes.data.status) {
        payout.transfer_code = transferRes.data.data.transfer_code
        payout.status        = "processing"
        await payout.save()
      }

    } catch (transferError) {
      // Transfer failed — restore runner earnings
      runner.totalEarnings += amount
      await runner.save()

      payout.status         = "failed"
      payout.failure_reason = transferError.response?.data?.message || transferError.message
      await payout.save()

      return res.status(502).json({
        success: false,
        message: "Transfer could not be initiated. Your earnings have been restored.",
        error  : payout.failure_reason
      })
    }

    // Notify runner
    const user = await User.findById(req.user._id)
    await notificationService.notifyUser({
      user,
      title  : "Payout initiated 💸",
      message: `Your payout of ₦${amount} to ${runner.bank_details.account_name} is being processed.`
    })

    return res.status(201).json({
      success: true,
      message: `Payout of ₦${amount} initiated. It will arrive within 24 hours.`,
      data   : payout
    })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to request payout",
      error  : error.message
    })
  }
}

// ─────────────────────────────────────────────────────
//  @route   GET /api/v1/payouts/history
//  @desc    Runner views their payout history
//  @access  Private — Runner
// ─────────────────────────────────────────────────────
const getPayoutHistory = async (req, res) => {
  try {
    const runner = await Runner.findOne({ user_id: req.user._id })
    if (!runner) {
      return res.status(404).json({ success: false, message: "Runner profile not found" })
    }

    const { page = 1, limit = 20 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const [payouts, total] = await Promise.all([
      Payout.find({ runner_id: runner._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Payout.countDocuments({ runner_id: runner._id })
    ])

    return res.json({
      success      : true,
      total,
      page         : parseInt(page),
      totalPages   : Math.ceil(total / parseInt(limit)),
      totalEarnings: runner.totalEarnings,
      data         : payouts
    })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payout history",
      error  : error.message
    })
  }
}

// ─────────────────────────────────────────────────────
//  @route   POST /api/v1/payouts/webhook
//  @desc    Paystack webhook — auto-update payout status
//  @access  Public (Paystack server only)
// ─────────────────────────────────────────────────────
const payoutWebhook = async (req, res) => {
  try {
    const crypto    = require("crypto")
    const signature = req.headers["x-paystack-signature"]

    // FIX: this used to hash JSON.stringify(req.body). Two bugs compounded:
    // (1) the global express.json() parser ran before this route's own
    // express.raw(), consuming the stream — see server.js — so req.body
    // was already a parsed object here, not raw bytes; (2) even so,
    // re-serializing a parsed object with JSON.stringify can produce
    // different bytes than what Paystack originally signed. Both are fixed
    // now: req.body here is the actual raw Buffer, and we hash that
    // directly and parse it ourselves after the signature check.
    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET)
      .update(req.body)
      .digest("hex")

    if (hash !== signature) {
      return res.status(401).json({ message: "Invalid signature" })
    }

    // Always respond 200 immediately to Paystack
    res.sendStatus(200)

    const { event, data } = JSON.parse(req.body.toString("utf8"))

    // ── Transfer success ──────────────────────────────
    if (event === "transfer.success") {
      const payout = await Payout.findOne({ reference: data.reference })
        .populate("user_id", "name email phone")

      if (payout) {
        payout.status       = "success"
        payout.completed_at = new Date()
        await payout.save()

        await notificationService.notifyUser({
          user   : payout.user_id,
          title  : "Payout successful! 🎉",
          message: `₦${payout.amount} has been sent to your ${payout.bank_name} account.`
        })
      }
    }

    // ── Transfer failed or reversed ───────────────────
    if (event === "transfer.failed" || event === "transfer.reversed") {
      const payout = await Payout.findOne({ reference: data.reference })
        .populate("user_id", "name email phone")

      if (payout) {
        payout.status         = event === "transfer.reversed" ? "reversed" : "failed"
        payout.failure_reason = data.reason || "Transfer failed"
        payout.completed_at   = new Date()
        await payout.save()

        // Restore runner earnings on failure
        await Runner.findByIdAndUpdate(payout.runner_id, {
          $inc: { totalEarnings: payout.amount }
        })

        await notificationService.notifyUser({
          user   : payout.user_id,
          title  : "Payout failed",
          message: `Your payout of ₦${payout.amount} could not be processed. Your earnings have been restored.`
        })
      }
    }

  } catch (error) {
    console.error("Payout webhook error:", error.message)
  }
}

// ─────────────────────────────────────────────────────
//  @route   GET /api/v1/admin/payouts
//  @desc    Admin views all payouts
//  @access  Admin
// ─────────────────────────────────────────────────────
const getAllPayouts = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query
    const skip  = (parseInt(page) - 1) * parseInt(limit)
    const query = {}
    if (status) query.status = status

    const [payouts, total] = await Promise.all([
      Payout.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("user_id",   "name email phone")
        .populate("runner_id", "totalEarnings completedJobs"),
      Payout.countDocuments(query)
    ])

    return res.json({
      success   : true,
      total,
      page      : parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data      : payouts
    })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payouts",
      error  : error.message
    })
  }
}

module.exports = {
  getBanks,
  verifyAccount,
  saveBankDetails,
  requestPayout,
  getPayoutHistory,
  payoutWebhook,
  getAllPayouts
}