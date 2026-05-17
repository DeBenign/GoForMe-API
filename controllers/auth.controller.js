const User   = require("../models/User")
const Wallet = require("../models/Wallet")
const jwt    = require("../utils/jwt")
const bcrypt = require("bcrypt")
const { v4: uuidv4 }      = require("uuid")
const notificationService = require("../services/notification.service")
 
const DUMMY_WALLET_BALANCE = 2000 // ₦2,000 dev credit — change once Paystack is live
 
// ── REGISTER ──────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body
 
    if (!email || !password || !name || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name, email, phone and password are required"
      })
    }
 
    const existing = await User.findOne({ email })
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Email already registered"
      })
    }
 
    const hashedPassword = await bcrypt.hash(password, 10)
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
 
    const user = await User.create({
      name,
      email,
      phone,
      password  : hashedPassword,
      otp,
      otpExpires: Date.now() + 10 * 60 * 1000
    })
 
    // FIX: explicitly set balance to DUMMY_WALLET_BALANCE
    // and record initial credit in transactions array
    const wallet = await Wallet.create({
      user_id     : user._id,
      balance     : DUMMY_WALLET_BALANCE,
      transactions: [{
        amount: DUMMY_WALLET_BALANCE,
        type  : "credit",
        reason: "[DEV] Welcome bonus — replace with Paystack in production"
      }]
    })
 
    // Send OTP via SMS
    await notificationService.sendSMS({
      user_id: user._id,
      to     : user.phone,
      message: `Your GoForMe OTP is ${otp}. Valid for 10 minutes.`
    })
 
    return res.status(201).json({
      success      : true,
      message      : "Account created. Please verify your OTP.",
      userId       : user._id,
      walletBalance: wallet.balance  // FIX: use actual value not hardcoded 2000
    })
 
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Registration failed",
      error  : error.message
    })
  }
}
 
// ── VERIFY OTP ────────────────────────────────────────
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body
 
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "email and otp are required"
      })
    }
 
    const user = await User.findOne({ email }).select("+otp +otpExpires")
 
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" })
    }
 
    if (user.otp !== otp.toString()) {
      return res.status(400).json({ success: false, message: "Invalid OTP" })
    }
 
    if (user.otpExpires < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Request a new one."
      })
    }
 
    user.isVerified = true
    user.otp        = null
    user.otpExpires = null
    await user.save()
 
    return res.json({ success: true, message: "Account verified. You can now log in." })
 
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "OTP verification failed",
      error  : error.message
    })
  }
}
 
// ── RESEND OTP ────────────────────────────────────────
const resendOTP = async (req, res) => {
  try {
    const { email } = req.body
 
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" })
    }
 
    const user = await User.findOne({ email }).select("+otp +otpExpires")
 
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" })
    }
 
    if (user.isVerified) {
      return res.status(400).json({ success: false, message: "Account is already verified" })
    }
 
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    user.otp        = otp
    user.otpExpires = Date.now() + 10 * 60 * 1000
    await user.save()
 
    await notificationService.sendSMS({
      user_id: user._id,
      to     : user.phone,
      message: `Your new GoForMe OTP is ${otp}. Valid for 10 minutes.`
    })
 
    return res.json({ success: true, message: "A new OTP has been sent to your phone." })
 
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to resend OTP",
      error  : error.message
    })
  }
}
 
// ── LOGIN ─────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body
 
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      })
    }
 
    const user = await User.findOne({ email }).select("+password")
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" })
    }
 
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your OTP before logging in.",
        userId : user._id
      })
    }
 
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" })
    }
 
    const accessToken  = jwt.generateToken(user._id)
    const refreshToken = uuidv4()
 
    user.refreshToken = refreshToken
    await user.save()
 
    const userData = user.toObject()
    delete userData.password
    delete userData.otp
    delete userData.refreshToken
 
    return res.json({
      success: true,
      user   : userData,
      accessToken,
      refreshToken
    })
 
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Login failed",
      error  : error.message
    })
  }
}
 
// ── LOGOUT ────────────────────────────────────────────
const logout = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("+refreshToken")
 
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" })
    }
 
    user.refreshToken = null
    await user.save()
 
    return res.json({ success: true, message: "Logged out successfully" })
 
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Logout failed",
      error  : error.message
    })
  }
}
 
// ── REFRESH TOKEN ─────────────────────────────────────
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body
 
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: "Refresh token required" })
    }
 
    const user = await User.findOne({ refreshToken })
    if (!user) {
      return res.status(403).json({ success: false, message: "Invalid refresh token" })
    }
 
    const newAccessToken = jwt.generateToken(user._id)
 
    return res.json({ success: true, accessToken: newAccessToken })
 
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Token refresh failed",
      error  : error.message
    })
  }
}
 
module.exports = { register, login, logout, verifyOTP, resendOTP, refreshToken }
 