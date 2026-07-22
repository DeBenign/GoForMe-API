/**
 * INTEGRATION NOTE — do not require() this file directly.
 * Add these fields to your existing User schema (models/User.js).
 *
 * referralCode: unique code each user can share.
 * referredBy: the User who referred this user (denormalized for quick lookup,
 *             separate from the Referral collection which holds reward state).
 */

/*
  referralCode: {
    type: String,
    unique: true,
    index: true,
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
*/

// Generate a short, human-shareable code on user creation.
// Add this as a pre('save') hook in User.js, or call generateReferralCode()
// from your existing signup controller right after user creation.

const crypto = require('crypto');

function generateReferralCode(name) {
  const prefix = (name || 'GFM').replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase() || 'GFM';
  const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}${suffix}`; // e.g. "OLAL9F2A3B"
}

module.exports = { generateReferralCode };