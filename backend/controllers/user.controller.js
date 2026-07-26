// controllers/user.controller.js
const User = require("../models/User")
const Runner = require("../models/Runner")   // FIX: was missing import
const Wallet = require("../models/Wallet")   // FIX: was missing import
const Order = require("../models/Order")     // FIX: was missing import
const bcrypt = require("bcrypt")

// ── CREATE USER ───────────────────────────────────────
const createUser = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body

    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name, email, phone and password are required"
      })
    }

    const existing = await User.findOne({ email })
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "User already exists"
      })
    }

    // FIX: password was saved in plain text — must hash before saving
    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await User.create({ name, email, phone, password: hashedPassword })

    // Remove password from response
    const userData = user.toObject()
    delete userData.password

    return res.status(201).json({ success: true, data: userData })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create user",
      error: error.message
    })
  }
}

// ── GET ALL USERS ─────────────────────────────────────
const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password -otp -refreshToken")

    return res.status(200).json({
      success: true,
      count: users.length,
      data: users
    })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message
    })
  }
}

// ── GET SINGLE USER ───────────────────────────────────
const getUser = async (req, res) => {
  try {
    // FIX: this had no access restriction — any authenticated user could
    // view any other user's full profile (email, phone, referral info) by
    // guessing/incrementing an id. No frontend actually needs cross-user
    // access here (customer_frontend only uses this route to fetch its own
    // profile), so restrict it to the user themselves or an admin.
    if (req.user.role !== "admin" && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ success: false, message: "Access denied" })
    }

    // FIX: removed unnecessary !id check — Express always fills req.params.id
    const user = await User.findById(req.params.id).select("-password -otp -refreshToken")

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" })
    }

    return res.status(200).json({ success: true, data: user })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching user",
      error: error.message
    })
  }
}

// ── UPDATE USER ───────────────────────────────────────
const updateUser = async (req, res) => {
  try {
    // FIX: block password updates through this route — use change-password route instead
    // Prevents accidental plain-text password overwrites
    const { password, otp, refreshToken, role, ...safeUpdates } = req.body

    const user = await User.findByIdAndUpdate(
      req.params.id,
      safeUpdates,
      { new: true, runValidators: true }
    ).select("-password -otp -refreshToken")

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" })
    }

    return res.json({ success: true, data: user })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update user",
      error: error.message
    })
  }
}

// ── DELETE USER ───────────────────────────────────────
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params

    const user = await User.findByIdAndDelete(id)

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" })
    }

    // Cleanup all related documents
    await Runner.deleteOne({ user_id: id })
    await Wallet.deleteOne({ user_id: id })
    await Order.deleteMany({ user_id: id })

    return res.json({ success: true, message: "User and all related data deleted" })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete user",
      error: error.message
    })
  }
}

module.exports = { createUser, getUsers, getUser, updateUser, deleteUser }