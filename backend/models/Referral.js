const mongoose = require('mongoose');

/**
 * Referral tracks a single referral relationship:
 * referrer (existing user) invited referee (new user) via a code.
 * Reward is only granted once referee completes a qualifying action
 * (their first completed order), to prevent fake-signup abuse.
 */
const referralSchema = new mongoose.Schema(
  {
    referrer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    referee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // a user can only ever be referred once
    },
    code: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'qualified', 'rewarded', 'expired'],
      default: 'pending',
    },
    // The order that satisfied the qualifying condition (referee's first completed order)
    qualifyingOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
    referrerRewardAmount: {
      type: Number,
      default: 500, // NGN wallet credit, tune per growth budget
    },
    refereeRewardAmount: {
      type: Number,
      default: 300, // NGN wallet credit or discount value
    },
    rewardedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30-day window
    },
  },
  { timestamps: true }
);

referralSchema.index({ referrer: 1, status: 1 });

module.exports = mongoose.model('Referral', referralSchema);