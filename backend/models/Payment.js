// models/Payment.js
const mongoose = require("mongoose")

const paymentSchema = new mongoose.Schema(
  {
    // FIX: was "String" — must be ObjectId ref
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // FIX: was "String" — must be ObjectId ref
    order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null // null for wallet top-ups (not tied to a specific order)
    },

    amount: {
      type: Number,
      required: true,
      min: 0
    },

    // Paystack unique transaction reference
    reference: {
      type: String,
      unique: true,
      sparse: true
    },

    email: {
      type: String
    },

    currency: {
      type: String,
      default: "NGN"
    },

    // FIX: was plain String with no enum — added proper values
    status: {
      type: String,
      enum: ["pending", "success", "failed", "reversed"],
      default: "pending"
    },

    // Type of payment
    type: {
      type: String,
      enum: ["order_payment", "wallet_funding", "runner_payout", "refund"],
      default: "order_payment"
    },

    paystackResponse: {
      type: mongoose.Schema.Types.Mixed, // Store raw Paystack response for audit
      default: null
    },

    paidAt: { type: Date, default: null }
  },
  { timestamps: true }
)

paymentSchema.index({ user_id: 1, createdAt: -1 })
paymentSchema.index({ reference: 1 })

module.exports = mongoose.model("Payment", paymentSchema)