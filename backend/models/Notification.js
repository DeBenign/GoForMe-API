// ── models/Notification.js ────────────────────────────
const mongoose = require("mongoose")
 
const notificationSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
 
    // FIX: "type" enum was ["email","sms","push"] and "channel" also ["email","sms"]
    // "channel" was missing "push" — push notifications would fail the enum validation
    // Also consolidated: "type" = the delivery method, "channel" removed (redundant)
    type: {
      type: String,
      enum: ["email", "sms", "push"],
      required: true
    },
 
    to: {
      type: String, // email address, phone number, or FCM token
      required: true
    },
 
    subject: {
      type: String,
      default: null // only used for emails
    },
 
    message: {
      type: String,
      required: true
    },
 
    title: {
      type: String,
      default: null // only used for push notifications
    },
 
    status: {
      type: String,
      enum: ["pending", "sent", "failed"],
      default: "pending"
    },
 
    response: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
 
    error: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
)
 
notificationSchema.index({ user_id: 1, createdAt: -1 })
notificationSchema.index({ status: 1 })
 
module.exports = mongoose.model("Notification", notificationSchema)