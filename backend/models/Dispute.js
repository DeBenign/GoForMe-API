// ═══════════════════════════════════════════════════════
//  models/Dispute.js
//  Week 6 — Dispute System
// ═══════════════════════════════════════════════════════

const mongoose = require("mongoose")

const disputeSchema = new mongoose.Schema(
  {
    order_id: {
      type    : mongoose.Schema.Types.ObjectId,
      ref     : "Order",
      required: true
    },

    raised_by: {
      type    : mongoose.Schema.Types.ObjectId,
      ref     : "User",
      required: true
    },

    against: {
      type    : mongoose.Schema.Types.ObjectId,
      ref     : "User",
      required: true
    },

    reason: {
      type    : String,
      enum    : [
        "item_not_delivered",
        "wrong_item",
        "runner_no_show",
        "overcharged",
        "damaged_item",
        "unfair_rating",
        "other"
      ],
      required: true
    },

    description: {
      type     : String,
      required : true,
      maxlength: 2000
    },

    status: {
      type   : String,
      enum   : ["open", "under_review", "resolved", "closed"],
      default: "open"
    },

    // Admin resolution
    resolved_by: {
      type   : mongoose.Schema.Types.ObjectId,
      ref    : "User",
      default: null
    },

    resolution: {
      type   : String,
      enum   : ["refund_issued", "no_action", "warning_given", "account_suspended", null],
      default: null
    },

    resolution_note: {
      type   : String,
      default: ""
    },

    refund_amount: {
      type   : Number,
      default: 0
    },

    refund_issued: {
      type   : Boolean,
      default: false
    },

    resolved_at: {
      type   : Date,
      default: null
    }
  },
  { timestamps: true }
)

disputeSchema.index({ order_id: 1 })
disputeSchema.index({ raised_by: 1 })
disputeSchema.index({ status: 1, createdAt: -1 })

module.exports = mongoose.model("Dispute", disputeSchema)
