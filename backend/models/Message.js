// ── models/Message.js ─────────────────────────────────
const mongoose = require("mongoose")
 
const messageSchema = new mongoose.Schema(
  {
    // FIX: were plain Strings — must be ObjectId refs so we can populate sender/receiver
    sender_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    receiver_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
 
    // FIX: renamed from "message" to "content" — "message" is a reserved-ish word
    // and conflicts with the Notification model field of the same name causing confusion
    content: {
      type: String,
      required: [true, "Message content is required"],
      trim: true,
      maxlength: [2000, "Message cannot exceed 2000 characters"]
    },
 
    // FIX: added order_id — messages belong to an order room (matches socket order:join)
    order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null
    },
 
    isRead: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
)
 
// Index for fast order chat history queries
messageSchema.index({ order_id: 1, createdAt: 1 })
messageSchema.index({ sender_id: 1, receiver_id: 1 })
 
module.exports = mongoose.model("Message", messageSchema)