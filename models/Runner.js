// ── models/Runner.js ──────────────────────────────────
const mongoose = require("mongoose")
 
const runnerSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      unique: true
    },
 
    skills: {
      type: [String],
      default: []
    },
 
    // FIX: location.lat and location.lng were "required" at schema level
    // but createRunner only requires location to be present in req.body
    // A runner applying doesn't always have precise GPS yet — made optional
    // and validated at the controller level instead
    location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null }
    },
 
    rating: {
      type: Number,
      default: 5.0, // FIX: was 4.5 hardcoded — new runners should start neutral (5.0)
      min: 0,
      max: 5
    },
 
    totalRatings: {
      type: Number,
      default: 0 // FIX: track how many ratings to compute average correctly
    },
 
    isAvailable: {
      type: Boolean,
      default: false // FIX: was true — new runners should be OFFLINE until approved
    },
 
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    },
 
    // FIX: added currentOrder — needed by completeOrder to clear runner's job reference
    currentOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null
    },
 
    totalEarnings: {
      type: Number,
      default: 0
    },
 
    completedJobs: {
      type: Number,
      default: 0
    },
  // Add this inside runnerSchema — after completedJobs field
  bank_details: {
    account_number : { type: String, default: null },
    bank_code      : { type: String, default: null },
    bank_name      : { type: String, default: null },
    account_name   : { type: String, default: null },
    recipient_code : { type: String, default: null } // Paystack transfer recipient
  }
},
  { timestamps: true }
)
 
// Geo index for proximity matching
runnerSchema.index({ "location.lat": 1, "location.lng": 1 })
runnerSchema.index({ status: 1, isAvailable: 1 })
 
module.exports = mongoose.model("Runner", runnerSchema)