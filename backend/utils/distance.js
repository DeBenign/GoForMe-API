// ── utils/distance.js ─────────────────────────────────
// FIX: matching.service.js had its own inline Haversine function
// AND utils/distance.js had another Haversine function — duplicate code
// Deleted the inline one from matching.service.js
// This is now the single source of truth for distance calculation
 
exports.calculateDistance = (loc1, loc2) => {
  const toRad = (value) => (value * Math.PI) / 180
 
  const R    = 6371 // Earth radius in km
  const dLat = toRad(loc2.lat - loc1.lat)
  const dLon = toRad(loc2.lng - loc1.lng)
 
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(loc1.lat)) *
    Math.cos(toRad(loc2.lat)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2)
 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
 
  return R * c // returns distance in km
}