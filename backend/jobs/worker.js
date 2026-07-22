// ── jobs/notification.worker.js ───────────────────────
// FIX: Redis connection with no config — defaults to localhost:6379
// Added error handler so worker failure doesn't silently crash the process
// FIX: no error handling on the worker job function — a bad job killed the worker
 
const { Worker } = require("bullmq")
const Redis      = require("ioredis")
const notificationService = require("../services/notification.service")
 
const connection = new Redis({
  host             : process.env.REDIS_HOST || "127.0.0.1",
  port             : process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null // required by BullMQ
})
 
const worker = new Worker("notifications", async (job) => {
  const { type, data } = job.data
 
  console.log(`📬 Processing notification job: ${type}`)
 
  if (type === "email") await notificationService.sendEmail(data)
  if (type === "sms")   await notificationService.sendSMS(data)
  if (type === "push")  await notificationService.sendPush(data)
 
}, { connection })
 
// FIX: added error listeners — without these, worker errors are swallowed silently
worker.on("completed", (job) => {
  console.log(`✅ Notification job ${job.id} completed`)
})
 
worker.on("failed", (job, err) => {
  console.error(`❌ Notification job ${job.id} failed:`, err.message)
})
 
module.exports = worker