const mongoose = require('mongoose');

/**
 * One row per successful redemption. Lets us enforce
 * maxRedemptionsPerUser and gives an audit trail of discounts applied.
 */
const promoRedemptionSchema = new mongoose.Schema(
  {
    promoCode: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PromoCode',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    discountApplied: {
      type: Number,
      required: true, // actual NGN amount discounted, for reporting
    },
  },
  { timestamps: true }
);

promoRedemptionSchema.index({ promoCode: 1, user: 1 });

module.exports = mongoose.model('PromoRedemption', promoRedemptionSchema);