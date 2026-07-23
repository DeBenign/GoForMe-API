// models/User.js
const mongoose = require("mongoose")

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email"]
    },

    // FIX: phone was missing — auth controller, SMS notifications, and
    // runner application all reference user.phone
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      trim: true
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false // Never return password in queries by default
    },

    // FIX: was Number — OTP must be String to prevent leading-zero loss
    // e.g. OTP "012345" stored as Number becomes 12345 (5 digits) — comparison breaks
    otp: {
      type: String,
      default: null,
      select: false
    },

    otpExpires: {
      type: Date,
      default: null,
      select: false
    },

    isVerified: {
      type: Boolean,
      default: false
    },

    refreshToken: {
      type: String,
      default: null,
      select: false
    },

    role: {
      type: String,
      enum: ["customer", "runner", "admin"],
      default: "customer"
    },

    // For push notifications (Firebase FCM)
    pushToken: {
      type: String,
      default: null
    },

    isActive: {
      type: Boolean,
      default: true
    },

    // Referral program — code this user can share, and who referred them
    // (if anyone). Reward crediting/state lives in the separate Referral
    // collection; these two fields are just for lookup and display.
    referralCode: {
      type: String,
      unique: true,
      sparse: true, // allows many docs with no code yet without violating uniqueness
      index: true
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  { timestamps: true }
)

module.exports = mongoose.model("User", userSchema)