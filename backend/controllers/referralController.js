const crypto = require('crypto');
const Referral = require('../models/Referral');
const User = require('../models/User');
const Order = require('../models/Order');
const Wallet = require('../models/Wallet');

function generateReferralCode(name) {
  const prefix = (name || 'GFM').replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase() || 'GFM';
  const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}${suffix}`; // e.g. "OLAL9F2A3B"
}

/**
 * GET /api/v1/referrals/me
 * Returns the current user's referral code + stats, for share screens.
 */
exports.getMyReferralInfo = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.referralCode) {
      user.referralCode = generateReferralCode(user.name);
      await user.save();
    }

    const [pending, qualified, rewarded] = await Promise.all([
      Referral.countDocuments({ referrer: user._id, status: 'pending' }),
      Referral.countDocuments({ referrer: user._id, status: 'qualified' }),
      Referral.countDocuments({ referrer: user._id, status: 'rewarded' }),
    ]);

    return res.json({
      code: user.referralCode,
      shareMessage: `Use my GoForMe code ${user.referralCode} and we both get credit on your first errand!`,
      stats: { pending, qualified, rewarded },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load referral info', detail: err.message });
  }
};

/**
 * POST /api/v1/referrals/apply
 * body: { code }
 * Called right after signup, before the user places their first order.
 * Enforces one referral per new user and blocks self-referral.
 */
exports.applyReferralCode = async (req, res) => {
  try {
    const { code } = req.body;
    const refereeId = req.user._id.toString();

    const referrer = await User.findOne({ referralCode: code });
    if (!referrer) {
      return res.status(404).json({ error: 'Invalid referral code' });
    }
    if (referrer._id.toString() === refereeId) {
      return res.status(400).json({ error: 'You cannot refer yourself' });
    }

    const existing = await Referral.findOne({ referee: refereeId });
    if (existing) {
      return res.status(409).json({ error: 'A referral has already been applied to this account' });
    }

    const referral = await Referral.create({
      referrer: referrer._id,
      referee: refereeId,
      code,
      status: 'pending',
    });

    await User.findByIdAndUpdate(refereeId, { referredBy: referrer._id });

    return res.status(201).json({ message: 'Referral applied', referral });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to apply referral code', detail: err.message });
  }
};

/**
 * Internal helper — call this from order.controller.js completeOrder(),
 * right after order.status is set to "completed". Not an HTTP route.
 *
 * Checks whether this is the referee's FIRST completed order as a
 * customer; if so, marks the referral qualified and credits both wallets
 * via the real Wallet collection (wallets are keyed by user_id, not an
 * embedded field on User).
 */
exports.tryQualifyReferralOnOrderComplete = async (userId, orderId) => {
  const referral = await Referral.findOne({ referee: userId, status: 'pending' });
  if (!referral) return null;

  const priorCompletedCount = await Order.countDocuments({
    user_id: userId,
    status: 'completed',
  });

  // priorCompletedCount is 1 if the just-completed order is the customer's first ever
  if (priorCompletedCount !== 1) return null;

  referral.status = 'qualified';
  referral.qualifyingOrder = orderId;
  await referral.save();

  await creditWallet(referral.referrer, referral.referrerRewardAmount, 'Referral reward — friend completed their first errand');
  await creditWallet(referral.referee, referral.refereeRewardAmount, 'Referral reward — welcome credit');

  referral.status = 'rewarded';
  referral.rewardedAt = new Date();
  await referral.save();

  return referral;
};

async function creditWallet(userId, amount, reason) {
  const wallet = await Wallet.findOne({ user_id: userId });
  if (!wallet) return; // no wallet yet — nothing to credit; the reward is simply skipped rather than crashing the order-completion flow
  wallet.balance += amount;
  wallet.transactions.push({ amount, type: 'credit', reason });
  await wallet.save();
}