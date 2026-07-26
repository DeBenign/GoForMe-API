const Rating = require('../models/Rating');
const User = require('../models/User');
const Order = require('../models/Order');
const Runner = require('../models/Runner');

/**
 * POST /api/v1/ratings
 * body: { orderId, stars, comment, tags }
 * The rater is req.user; the ratee and raterRole are derived from the order
 * so a client can't fake who they're rating.
 *
 * NOTE: order.runner_id points at a Runner document, not a User — the
 * runner's User id has to be resolved via Runner.user_id before it can be
 * compared against req.user._id or stored as Rating.ratee (which is a
 * User ref, kept consistent for both directions of rating).
 */
exports.submitRating = async (req, res) => {
  try {
    const { orderId, stars, comment, tags, platformStars, platformComment } = req.body;
    const raterId = req.user._id.toString();

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.status !== 'completed') {
      return res.status(400).json({ error: 'Only completed orders can be rated' });
    }

    const runnerDoc = order.runner_id ? await Runner.findById(order.runner_id) : null;

    let raterRole, rateeId;
    if (order.user_id.toString() === raterId) {
      raterRole = 'customer';
      rateeId = runnerDoc ? runnerDoc.user_id : null;
    } else if (runnerDoc && runnerDoc.user_id.toString() === raterId) {
      raterRole = 'runner';
      rateeId = order.user_id;
    } else {
      return res.status(403).json({ error: 'You were not party to this order' });
    }

    if (!rateeId) {
      return res.status(400).json({ error: 'Order has no counterpart to rate' });
    }

    // Platform satisfaction is a customer-only signal — separate from how
    // the runner personally did — so it's silently ignored if a runner
    // sends it, rather than erroring on an extra field they shouldn't set.
    const isCustomerRating = raterRole === 'customer';
    if (isCustomerRating && platformStars !== undefined && platformStars !== null) {
      const n = Number(platformStars);
      if (!Number.isInteger(n) || n < 1 || n > 5) {
        return res.status(400).json({ error: 'platformStars must be a whole number from 1 to 5' });
      }
    }

    const rating = await Rating.create({
      order: orderId,
      rater: raterId,
      ratee: rateeId,
      raterRole,
      stars,
      comment: comment || '',
      tags: tags || [],
      platformStars: isCustomerRating && platformStars ? Number(platformStars) : null,
      platformComment: isCustomerRating ? (platformComment || '') : '',
    });

    const aggregate = await recomputeAggregate(rateeId);

    // Keep the existing Runner.rating field (already used elsewhere — the
    // runner dashboard, matching logic, admin views) in sync when a runner
    // was the one rated. Customers have no equivalent field anywhere else
    // in the schema, so their aggregate just lives in the Rating collection.
    if (raterRole === 'customer' && runnerDoc) {
      runnerDoc.rating = aggregate.average;
      await runnerDoc.save();
    }

    return res.status(201).json({ message: 'Rating submitted', rating });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'You have already rated this order' });
    }
    return res.status(500).json({ error: 'Failed to submit rating', detail: err.message });
  }
};

/**
 * GET /api/v1/ratings/user/:userId
 * Public read: average, count, and recent comments for anyone (runner or
 * customer). Computed live from the Rating collection rather than a
 * denormalized field, since only Runner has a pre-existing rating field
 * in the schema and this route needs to work for either role.
 */
exports.getUserRatings = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('name role');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const [aggregate, recent] = await Promise.all([
      recomputeAggregate(userId, { persist: false }),
      Rating.find({ ratee: userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('stars comment tags createdAt raterRole'),
    ]);

    return res.json({ average: aggregate.average, count: aggregate.count, recent });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load ratings', detail: err.message });
  }
};

/**
 * Computes {average, count} for a ratee straight from the Rating
 * collection. `persist` only controls whether Runner.rating also gets
 * synced here — submitRating already does that explicitly above, so
 * getUserRatings calls this with persist:false to avoid a redundant write.
 */
async function recomputeAggregate(userId, { persist = false } = {}) {
  const stats = await Rating.aggregate([
    { $match: { ratee: userId } },
    { $group: { _id: '$ratee', avg: { $avg: '$stars' }, count: { $sum: 1 } } },
  ]);

  const { avg = 0, count = 0 } = stats[0] || {};
  const average = Math.round(avg * 10) / 10;

  if (persist) {
    const runnerDoc = await Runner.findOne({ user_id: userId });
    if (runnerDoc) {
      runnerDoc.rating = average;
      await runnerDoc.save();
    }
  }

  return { average, count };
}

exports._recomputeAggregate = recomputeAggregate;

/**
 * GET /api/v1/ratings/platform (admin only)
 * Aggregate of the separate "how was your GoForMe experience" signal —
 * independent of individual runner ratings — across every completed order.
 */
exports.getPlatformRatings = async (req, res) => {
  try {
    const [stats] = await Rating.aggregate([
      { $match: { platformStars: { $ne: null } } },
      { $group: { _id: null, avg: { $avg: '$platformStars' }, count: { $sum: 1 } } },
    ]);

    const recent = await Rating.find({ platformStars: { $ne: null } })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('platformStars platformComment createdAt order');

    return res.json({
      average: stats ? Math.round(stats.avg * 10) / 10 : 0,
      count: stats ? stats.count : 0,
      recent,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load platform ratings', detail: err.message });
  }
};