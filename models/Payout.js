// models/Payout.js
const mongoose = require("mongoose")

const payoutSchema = new mongoose.Schema(
  {
    runner_id: {
      type    : mongoose.Schema.Types.ObjectId,
      ref     : "Runner",
      required: true
    },

    user_id: {
      type    : mongoose.Schema.Types.ObjectId,
      ref     : "User",
      required: true
    },

    amount: {
      type    : Number,
      required: true,
      min     : [500, "Minimum payout is ₦500"]
    },

    // Paystack transfer details
    recipient_code: {
      type   : String,
      default: null
    },

    transfer_code: {
      type   : String,
      default: null
    },

    reference: {
      type  : String,
      unique: true
    },

    bank_name      : { type: String, default: null },
    account_number : { type: String, default: null },
    account_name   : { type: String, default: null },

    status: {
      type   : String,
      enum   : ["pending", "processing", "success", "failed", "reversed"],
      default: "pending"
    },

    failure_reason: {
      type   : String,
      default: null
    },

    initiated_at : { type: Date, default: Date.now },
    completed_at : { type: Date, default: null }
  },
  { timestamps: true }
)


module.exports = mongoose.model("Payout", payoutSchema)