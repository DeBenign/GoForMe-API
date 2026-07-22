const mongoose = require('mongoose');

/**
 * A promo code definition — admin-created, reusable across many users
 * (unlike Referral, which is a one-off pair relationship).
 */
const promoCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      default: '', // e.g. "First order discount", "Independence Day promo"
    },
    discountType: {
      type: String,
      enum: ['percentage', 'flat'],
      required: true,
    },
    discountValue: {
      type: Number, // percentage (0-100) or flat NGN amount, per discountType
      required: true,
    },
    maxDiscountAmount: {
      type: Number, // caps a percentage discount, e.g. 20% off up to ₦1000
      default: null,
    },
    minOrderValue: {
      type: Number,
      default: 0,
    },
    // Restrict to first-time customers only — common for acquisition promos
    firstOrderOnly: {
      type: Boolean,
      default: false,
    },
    // Total redemptions allowed across all users, null = unlimited
    maxRedemptions: {
      type: Number,
      default: null,
    },
    // Redemptions allowed per single user
    maxRedemptionsPerUser: {
      type: Number,
      default: 1,
    },
    redemptionCount: {
      type: Number,
      default: 0,
    },
    active: {
      type: Boolean,
      default: true,
    },
    startsAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // admin who created it
    },
  },
  { timestamps: true }
);

promoCodeSchema.index({ code: 1, active: 1 });

module.exports = mongoose.model('PromoCode', promoCodeSchema);