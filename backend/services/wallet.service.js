// services/wallet.service.js
// Shared by wallet.controller.js (redirect-based /wallet/verify) and
// payment.controller.js (Paystack webhook) so a top-up is credited exactly
// once no matter which path notices the payment first.

const Wallet = require("../models/Wallet")
const User = require("../models/User")
const { verifyPayment } = require("./payment.service")

// Verifies a Paystack reference with Paystack itself (never trust amounts
// from the client or from the webhook body alone), then credits the
// matching user's wallet if it hasn't been credited for this reference yet.
// Safe to call twice for the same reference — returns the existing balance
// on the second call instead of crediting again.
const creditWalletForReference = async (reference) => {
  const response = await verifyPayment(reference)

  if (response.data.status !== "success") {
    return { credited: false, reason: "Payment was not successful" }
  }

  const amount = response.data.amount / 100 // kobo -> naira
  const email = response.data.customer.email

  const user = await User.findOne({ email })
  if (!user) {
    return { credited: false, reason: "User not found for this payment" }
  }

  const wallet = await Wallet.findOne({ user_id: user._id })
  if (!wallet) {
    return { credited: false, reason: "Wallet not found" }
  }

  const alreadyCredited = wallet.transactions.some((t) => t.reference === reference)
  if (alreadyCredited) {
    return { credited: false, alreadyCredited: true, balance: wallet.balance }
  }

  wallet.balance += amount
  wallet.transactions.push({
    amount,
    type: "credit",
    reason: "Wallet top-up via Paystack",
    reference
  })
  await wallet.save()

  return { credited: true, balance: wallet.balance, amount, userId: user._id }
}

module.exports = { creditWalletForReference }