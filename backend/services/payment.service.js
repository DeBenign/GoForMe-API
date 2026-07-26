// services/payment.service.js
// FIX: no error handling — any Paystack failure threw an unhandled error
// FIX: verifyWebhookSignature now hashes the raw request bytes (see below)

const axios = require("axios")
const crypto = require("crypto")

const paystackClient = axios.create({
  baseURL: "https://api.paystack.co",
  headers: {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET}`,
    "Content-Type": "application/json"
  }
})

const initializePayment = async (email, amount, callback_url) => {
  try {
    const response = await paystackClient.post("/transaction/initialize", {
      email,
      amount: Math.round(amount * 100), // FIX: use Math.round to avoid float issues
      ...(callback_url && { callback_url })
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
// FIX: this must hash the exact raw bytes Paystack sent and signed. This
// now receives the raw request Buffer (see server.js + payment.controller.js,
// which exclude the webhook route from the global express.json() parser so
// the bytes reach here unmodified). Hashing JSON.stringify(parsedBody)
// instead — as this used to — re-serializes the object and can produce
// different bytes (key order, spacing, unicode escaping) than what Paystack
// actually signed, causing valid webhooks to fail verification.
const verifyWebhookSignature = (rawBody, signature) => {
  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET)
    .update(rawBody)
    .digest("hex")
  return hash === signature
}

module.exports = { initializePayment, verifyPayment, verifyWebhookSignature }