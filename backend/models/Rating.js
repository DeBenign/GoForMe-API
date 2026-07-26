const mongoose = require('mongoose');

/**
 * A single rating tied to a completed order. Bidirectional: either the
 * customer rating the runner, or the runner rating the customer.
 * One rating per (order, rater) pair — enforced by unique index.
 */
const ratingSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    rater: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ratee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    raterRole: {
      type: String,
      enum: ['customer', 'runner'],
      required: true, // who is doing the rating, so we know which direction this is
    },
    stars: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    comment: {
      type: String,
      maxlength: 500,
      default: '',
    },
    tags: {
      // quick-tap qualifiers instead of forcing free text, e.g. "Polite", "Late", "Careful with items"
      type: [String],
      default: [],
    },
    // Separate from `stars` (which rates the runner/customer counterpart).
    // Only customers rate the platform itself — the overall app experience
    // for that errand (matching speed, app usability, fee fairness, etc.)
    // — independent of how the runner personally did. Left null for
    // runner-submitted ratings.
    platformStars: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    platformComment: {
      type: String,
      maxlength: 500,
      default: '',
    },
  },
  { timestamps: true }
);

ratingSchema.index({ order: 1, rater: 1 }, { unique: true });

module.exports = mongoose.model('Rating', ratingSchema);