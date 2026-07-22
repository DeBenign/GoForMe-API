const mongoose = require('mongoose');

/**
 * A log of every re-engagement message sent. Two jobs it does:
 * 1. Prevents double-sending the same nudge to the same user same day.
 * 2. Gives you a raw table to join against orders later for attribution
 *    (e.g. "did this nudge lead to a booking within 24h?").
 */
const notificationLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['REPEAT_ERRAND_NUDGE', 'CART_ABANDONED', 'DORMANT_USER_WINBACK', 'RUNNER_LOW_ACTIVITY'],
      required: true,
    },
    channel: {
      type: String,
      enum: ['sms', 'push'],
      required: true,
    },
    status: {
      type: String,
      enum: ['sent', 'failed'],
      required: true,
    },
    errorMessage: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// One send per user/type/day is the common guard — enforced in job logic,
// this index just makes that lookup fast.
notificationLogSchema.index({ user: 1, type: 1, createdAt: -1 });

module.exports = mongoose.model('NotificationLog', notificationLogSchema);