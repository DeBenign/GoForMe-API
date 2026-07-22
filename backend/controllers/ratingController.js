const Rating = require('../models/Rating');
const User = require('../models/User');
const Order = require('../models/Order'); // assumes existing Order model

/**
 * POST /api/ratings
 * body: { orderId, stars, comment, tags }
 * The rater is req.user; the ratee and raterRole are derived from the order
 * so a client can't fake who they're rating.
 */
exports.submitRating = async (req, res) => {
  try {
    const { orderId, stars, comment, tags } = req.body;
    const raterId = req.user.id;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.status !== 'completed') {
      return res.status(400).json({ error: 'Only completed orders can be rated' });
    }

    let raterRole, rateeId;
    if (order.customer.toString() === raterId) {
      raterRole = 'customer';
      rateeId = order.runner;
    } else if (order.runner && order.runner.toString() === raterId) {
      raterRole = 'runner';
      rateeId = order.customer;
    } else {
      return res.status(403).json({ error: 'You were not party to this order' });
    }

    if (!rateeId) {
      return res.status(400).json({ error: 'Order has no counterpart to rate' });
    }

    const rating = await Rating.create({
      order: orderId,
      rater: raterId,
      ratee: rateeId,
      raterRole,
      stars,
      comment: comment || '',
      tags: tags || [],
    });

    await recomputeAggregate(rateeId);

    res.status(201).json({ message: 'Rating submitted', rating });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'You have already rated this order' });
    }
    res.status(500).json({ error: 'Failed to submit rating', detail: err.message });
  }
};

/**
 * GET /api/ratings/user/:userId
 * Public-ish profile view: average, count, and recent comments.
 * Used on runner cards shown to customers before they book, and vice versa.
 */
exports.getUserRatings = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('ratingAverage ratingCount name');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const recent = await Rating.find({ ratee: userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('stars comment tags createdAt raterRole');

    res.json({
      average: user.ratingAverage,
      count: user.ratingCount,
      recent,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load ratings', detail: err.message });
  }
};

/**
 * Recompute and store the denormalized average/count for a user.
 * Call after every new rating; cheap enough at this scale (aggregate over
 * one user's ratings, not the whole collection).
 */
async function recomputeAggregate(userId) {
  const stats = await Rating.aggregate([
    { $match: { ratee: userId } },
    { $group: { _id: '$ratee', avg: { $avg: '$stars' }, count: { $sum: 1 } } },
  ]);

  const { avg = 0, count = 0 } = stats[0] || {};
  await User.findByIdAndUpdate(userId, {
    ratingAverage: Math.round(avg * 10) / 10, // one decimal place
    ratingCount: count,
  });
}

exports._recomputeAggregate = recomputeAggregate; // exported for tests