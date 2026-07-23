// models/Order.js
const mongoose = require("mongoose")

const orderSchema = new mongoose.Schema(
  {
    // FIX: was "customer_id: String" — must be ObjectId ref to User
    // Also matches what order.controller uses (user_id)
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Customer is required"]
    },

    // FIX: runner_id was declared TWICE in the original schema
    // Once as String (top) and once as ObjectId (bottom)
    // In Mongoose the last definition wins, but it's a critical bug
    // Keeping only one correct definition:
    runner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Runner",
      default: null
    },

    title: {
      type: String,
      trim: true
    },

    description: {
      type: String,
      trim: true
    },

    category: {
      type: String,
      enum: ["grocery", "pharmacy", "document", "food", "bank", "office", "other"],
      default: "other"
    },

    // FIX: was "budget" but order.controller references "price" — unified to price
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"]
    },

    pickup_location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      address: { type: String, default: "" }
    },

    dropoff_location: {
      lat: { type: Number },
      lng: { type: Number },
      address: { type: String, default: "" }
    },

    // Live runner location (updated via socket)
    current_location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null }
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "in_progress", "completed", "cancelled"],
      default: "pending"
    },

    // Runners who declined this order — excluded from rematching so the
    // same runner isn't offered the same errand twice in a row.
    declinedBy: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Runner",
      default: []
    },
    // Timestamps for key status changes
    completedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null }
  },
  { timestamps: true }
)

// Index for fast user and runner queries
orderSchema.index({ user_id: 1, createdAt: -1 })
orderSchema.index({ runner_id: 1, status: 1 })

module.exports = mongoose.model("Order", orderSchema)