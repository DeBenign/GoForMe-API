const Referral = require('../models/Referral');
const User = require('../models/User'); // assumes existing User model with `wallet.balance` or similar
const { generateReferralCode } = require('../models/User.referral.addon');

/**
 * GET /api/referrals/me
 * Returns the current user's referral code + stats, for share screens.
 */
exports.getMyReferralInfo = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.referralCode) {
      user.referralCode = generateReferralCode(user.name || user.phone);
      await user.save();
    }

    const [pending, qualified, rewarded] = await Promise.all([
      Referral.countDocuments({ referrer: user._id, status: 'pending' }),
      Referral.countDocuments({ referrer: user._id, status: 'qualified' }),
      Referral.countDocuments({ referrer: user._id, status: 'rewarded' }),
    ]);

    res.json({
      code: user.referralCode,
      shareMessage: `Use my GoForMe code ${user.referralCode} and we both get credit on your first errand!`,
      stats: { pending, qualified, rewarded },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load referral info', detail: err.message });
  }
};

/**
 * POST /api/referrals/apply
 * body: { code }
 * Called during/right after signup, before the user places their first order.
 * Enforces one referral per new user and blocks self-referral.
 */
exports.applyReferralCode = async (req, res) => {
  try {
    const { code } = req.body;
    const refereeId = req.user.id;

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

    res.status(201).json({ message: 'Referral applied', referral });
  } catch (err) {
    res.status(500).json({ error: 'Failed to apply referral code', detail: err.message });
  }
};

/**
 * Internal helper — call this from your existing completeOrder() controller,
 * right after an order transitions to 'completed'. Not an HTTP route.
 *
 * Checks whether this is the referee's FIRST completed order; if so,
 * marks the referral qualified and credits both wallets.
 */
exports.tryQualifyReferralOnOrderComplete = async (userId, orderId, Order) => {
  const referral = await Referral.findOne({ referee: userId, status: 'pending' });
  if (!referral) return null;

  const priorCompletedCount = await Order.countDocuments({
    customer: userId,
    status: 'completed',
  });

  // priorCompletedCount will be 1 if the just-completed order is the first ever
  if (priorCompletedCount !== 1) return null;

  referral.status = 'qualified';
  referral.qualifyingOrder = orderId;
  await referral.save();

  // Credit both wallets — adjust field names to match your actual wallet schema
  await User.findByIdAndUpdate(referral.referrer, {
    $inc: { 'wallet.balance': referral.referrerRewardAmount },
  });
  await User.findByIdAndUpdate(referral.referee, {
    $inc: { 'wallet.balance': referral.refereeRewardAmount },
  });

  referral.status = 'rewarded';
  referral.rewardedAt = new Date();
  await referral.save();

  return referral;
};