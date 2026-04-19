// ── services/payment.service.js ───────────────────────
// FIX: no error handling — any Paystack failure threw an unhandled error
// FIX: added verifyWebhookSignature for the webhook route
 
const axios  = require("axios")
const crypto = require("crypto")
 
const paystackClient = axios.create({
  baseURL: "https://api.paystack.co",
  headers: {
    Authorization : `Bearer ${process.env.PAYSTACK_SECRET}`,
    "Content-Type": "application/json"
  }
})
 
const initializePayment = async (email, amount) => {
  try {
    const response = await paystackClient.post("/transaction/initialize", {
      email,
      amount: Math.round(amount * 100) // FIX: use Math.round to avoid float issues
    })
    return response.data
 
  } catch (error) {
    const message = error.response?.data?.message || error.message
    throw new Error(`Paystack initialize failed: ${message}`)
  }
}
 
const verifyPayment = async (reference) => {
  try {
    const response = await paystackClient.get(`/transaction/verify/${reference}`)
    return response.data
 
  } catch (error) {
    const message = error.response?.data?.message || error.message
    throw new Error(`Paystack verify failed: ${message}`)
  }
}
 
// Webhook signature verification
const verifyWebhookSignature = (rawBody, signature) => {
  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET)
    .update(JSON.stringify(rawBody))
    .digest("hex")
  return hash === signature
}
 
// Handle Paystack webhook events
const handleWebhook = async (body, signature) => {
  if (!verifyWebhookSignature(body, signature)) {
    throw new Error("Invalid webhook signature")
  }
 
  const { event, data } = body
  console.log(`📡 Paystack webhook: ${event}`)
 
  // Handle charge success — update transaction/wallet here
  if (event === "charge.success") {
    console.log(`✅ Payment confirmed: ${data.reference}`)
    // TODO: find Transaction by reference and mark as success
  }
 
  if (event === "transfer.success") {
    console.log(`💸 Transfer confirmed: ${data.reference}`)
    // TODO: mark runner withdrawal as paid
  }
}
 
module.exports = { initializePayment, verifyPayment, verifyWebhookSignature, handleWebhook }