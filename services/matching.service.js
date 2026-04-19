// ── services/matching.service.js ──────────────────────
// FIX: duplicate distance logic removed — now imports from utils/distance.js
// FIX: scoring formula comment was wrong ("closer is better" but used subtraction of rating
//      which means a runner 1km away rated 5.0 scores 0.7 - 1.5 = -0.8
//      while a runner 10km away rated 1.0 scores 7.0 - 0.3 = 6.7
//      So lower score = better — the "closer is better" logic was actually correct
//      but the comment was confusing. Added clearer comments.
 
const Runner = require("../models/Runner")
const { calculateDistance } = require("../utils/distance")
 
exports.matchRunnerToOrder = async (order) => {
  const runners = await Runner.find({
    status     : "approved",
    isAvailable: true,
    "location.lat": { $ne: null },
    "location.lng": { $ne: null }
  })
 
  if (!runners.length) return null
 
  let bestRunner = null
  let bestScore  = Infinity // lower score = better match
 
  for (const runner of runners) {
    const distance = calculateDistance(
      { lat: order.pickup_location.lat, lng: order.pickup_location.lng },
      { lat: runner.location.lat,       lng: runner.location.lng }
    )
 
    // Score: distance penalty minus rating bonus
    // Lower score = better — closest + highest rated runner wins
    const score = (distance * 0.7) - (runner.rating * 0.3)
 
    if (score < bestScore) {
      bestScore  = score
      bestRunner = runner
    }
  }
 
  return bestRunner
}