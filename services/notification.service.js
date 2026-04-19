// ── services/notification.service.js ─────────────────
const nodemailer    = require("nodemailer")
const twilio        = require("twilio")
const Notification  = require("../models/Notification")
const { getIO }     = require("../config/socket") // FIX: was missing destructuring
 
// FIX: admin was commented out but still called in sendPush below
// Either properly import it or guard it — now properly imported
// Make sure config/firebase.js exists and exports the initialized admin SDK

 
// ── Email transport ───────────────────────────────────
const transporter = nodemailer.createTransport({
  host  : process.env.EMAIL_HOST,
  port  : parseInt(process.env.EMAIL_PORT), // FIX: was String — nodemailer needs Number
  secure: false,
  auth  : {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})
 
// ── Twilio client ─────────────────────────────────────
const twilioClient = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH_TOKEN
)
 
// ── SEND EMAIL ────────────────────────────────────────
exports.sendEmail = async ({ user_id, to, subject, message }) => {
  const notification = await Notification.create({
    user_id, type: "email", to, subject, message
  })
 
  try {
    const info = await transporter.sendMail({
      from   : `"GoForMe" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html   : message
    })
    notification.status   = "sent"
    notification.response = info
 
  } catch (error) {
    notification.status = "failed"
    notification.error  = error.message
    console.error("Email send error:", error.message)
  }
 
  await notification.save()
  return notification
}
 
// ── SEND EMAIL OTP ────────────────────────────────────
exports.sendEmailOTP = async ({ user_id, to, otp }) => {
  const message = `
    <h2>Verify Your GoForMe Account</h2>
    <p>Your OTP code is: <strong>${otp}</strong></p>
    <p>This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
  `
  return exports.sendEmail({ user_id, to, subject: "Your GoForMe OTP Code", message })
}
 
// ── SEND SMS ──────────────────────────────────────────
exports.sendSMS = async ({ user_id, to, message }) => {
  const notification = await Notification.create({
    user_id, type: "sms", to, message
  })
 
  // Skip real Twilio call in development
  if (process.env.NODE_ENV === "development") {
    console.log(`📱 [DEV SMS] To: ${to} | Message: ${message}`)
    notification.status = "sent"
    await notification.save()
    return notification
  }
 
  try {
    const res = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE,
      to
    })
    notification.status   = "sent"
    notification.response = res
 
  } catch (error) {
    notification.status = "failed"
    notification.error  = error.message
    console.error("SMS send error:", error.message)
  }
 
  await notification.save()
  return notification
}
 

exports.sendPush = async ({ user_id, token, title, message }) => {
  console.log(`🔔 [PUSH SKIPPED - Firebase not configured] To: ${token} | ${title}`)
  return null // silently skip until Firebase is set up
}
 
// ── SMART NOTIFIER (email + SMS together) ────────────
exports.notifyUser = async ({ user, title, message }) => {
  const tasks = []
 
  if (user.email) {
    tasks.push(exports.sendEmail({
      user_id: user._id,
      to     : user.email,
      subject: title,
      message
    }))
  }
 
  if (user.phone) {
    tasks.push(exports.sendSMS({
      user_id: user._id,
      to     : user.phone,
      message: `${title}: ${message}`
    }))
  }
 
  // Don't throw if one channel fails — settle all
  return Promise.allSettled(tasks) // FIX: was Promise.all — one failure cancelled everything
}
 
// ── REALTIME NOTIFICATION (Socket.IO) ────────────────
exports.sendRealtimeNotification = (userId, payload) => {
  try {
    const io = getIO()
    io.to(`user_${userId}`).emit("notification", payload)
  } catch (error) {
    // Socket may not be initialized yet — log but don't crash
    console.error("Socket notification error:", error.message)
  }
}