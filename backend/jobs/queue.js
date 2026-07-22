// ── jobs/push.job.js ──────────────────────────────────
const admin        = require("../config/firebase")
const Notification = require("../models/Notification") // FIX: was missing import entirely
 
exports.sendPush = async ({ user_id, token, title, message }) => {
  const notification = await Notification.create({
    user_id,
    type   : "push",
    to     : token,
    title,
    message
  })
 
  try {
    const res = await admin.messaging().send({
      token,
      notification: { title, body: message }
    })
    notification.status   = "sent"
    notification.response = res
 
  } catch (error) {
    notification.status = "failed"
    notification.error  = error.message
    console.error("Push job error:", error.message)
  }
 
  await notification.save()
  return notification
}