/**
 * INTEGRATION NOTE — add these fields to your existing User schema.
 * Denormalized aggregates avoid recomputing an average on every profile
 * view / runner-matching query, which matters once rating volume grows.
 */

/*
  ratingAverage: {
    type: Number,
    default: 0,
  },
  ratingCount: {
    type: Number,
    default: 0,
  },
*/