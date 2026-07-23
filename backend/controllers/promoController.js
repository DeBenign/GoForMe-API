const PromoCode = require('../models/PromoCode');
const PromoRedemption = require('../models/PromoRedemption');
const Order = require('../models/Order');

/**
 * Shared validation logic used both when previewing a discount at checkout
 * and when actually applying it in createOrder. Keeping this in one place
 * prevents the classic bug of checkout showing one discount and the order
 * charging a different one.
 */
async function validateAndCompute(code, userId, orderValue) {
  const promo = await PromoCode.findOne({ code: code.toUpperCase(), active: true });
  if (!promo) throw { status: 404, message: 'Invalid or inactive promo code' };

  const now = new Date();
  if (now < promo.startsAt || now > promo.expiresAt) {
    throw { status: 400, message: 'This promo code is not currently valid' };
  }
  if (orderValue < promo.minOrderValue) {
    throw { status: 400, message: `Order must be at least ₦${promo.minOrderValue} to use this code` };
  }
  if (promo.maxRedemptions !== null && promo.redemptionCount >= promo.maxRedemptions) {
    throw { status: 400, message: 'This promo code has reached its redemption limit' };
  }

  const userRedemptions = await PromoRedemption.countDocuments({ promoCode: promo._id, user: userId });
  if (userRedemptions >= promo.maxRedemptionsPerUser) {
    throw { status: 400, message: 'You have already used this promo code' };
  }

  if (promo.firstOrderOnly) {
    const priorOrders = await Order.countDocuments({ user_id: userId, status: 'completed' });
    if (priorOrders > 0) {
      throw { status: 400, message: 'This promo code is for first-time customers only' };
    }
  }

  let discount =
    promo.discountType === 'percentage'
      ? (orderValue * promo.discountValue) / 100
      : promo.discountValue;

  if (promo.maxDiscountAmount !== null) {
    discount = Math.min(discount, promo.maxDiscountAmount);
  }
  discount = Math.min(discount, orderValue); // never discount more than the order costs

  return { promo, discount: Math.round(discount) };
}

/**
 * POST /api/promos/preview
 * body: { code, orderValue }
 * Used on the checkout screen before the order is created, so the customer
 * sees the exact discount before confirming.
 */
exports.previewPromo = async (req, res) => {
  try {
    const { code, orderValue } = req.body;
    const { discount } = await validateAndCompute(code, req.user._id, orderValue);
    res.json({ valid: true, discount, finalAmount: orderValue - discount });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to validate promo code' });
  }
};

/**
 * Internal helper — validates a code and computes the discount, without
 * side effects. Call this BEFORE creating the order (so the discounted
 * amount can be deducted from the wallet in one step), then call
 * recordRedemption() after the order exists to log it and bump counters.
 */
exports.computeDiscount = validateAndCompute;

/**
 * Internal helper — records a redemption and increments the promo's
 * counters. Needs a real orderId, so this runs after Order.create().
 */
exports.recordRedemption = async (promo, userId, orderId, discount) => {
  await PromoRedemption.create({
    promoCode: promo._id,
    user: userId,
    order: orderId,
    discountApplied: discount,
  });
  promo.redemptionCount += 1;
  await promo.save();
};

/**
 * Internal helper — validates + records in one call. Kept for convenience;
 * order.controller.js uses the two split functions above instead, since it
 * needs to know the discount before the order (and its id) exist.
 */
exports.applyPromoToOrder = async (code, userId, orderId, orderValue) => {
  if (!code) return null;
  const { promo, discount } = await validateAndCompute(code, userId, orderValue);
  await exports.recordRedemption(promo, userId, orderId, discount);
  return { discount, finalAmount: orderValue - discount };
};

/**
 * POST /api/promos (admin only)
 * Creates a new promo code. Gate this route with an admin-check middleware.
 */
exports.createPromo = async (req, res) => {
  try {
    const promo = await PromoCode.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ message: 'Promo code created', promo });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'A promo code with this code already exists' });
    }
    res.status(500).json({ error: 'Failed to create promo code', detail: err.message });
  }
};

/**
 * GET /api/promos (admin only)
 * List all promo codes with redemption stats, for the admin dashboard.
 */
exports.listPromos = async (req, res) => {
  try {
    const promos = await PromoCode.find().sort({ createdAt: -1 });
    res.json({ promos });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list promo codes', detail: err.message });
  }
};