// config/errandFee.js
//
// The "errand fee" is the runner's service charge for running the errand —
// separate from the item budget (the cash the runner spends on the
// customer's behalf at the pharmacy/grocery store/etc). Before this file
// existed, the customer's entered amount WAS the whole charge, so the
// platform's 15% commission (see config/commission.js) was being taken out
// of money that was actually meant to buy the customer's groceries/meds —
// shortchanging the runner on both the reimbursement and the service fee.
//
// Now: errandFee is calculated automatically from the distance between
// pickup and drop-off, and ONLY the errand fee is split between runner and
// platform. The item budget passes through to the runner untouched.
//
// Configurable via env so pricing can be tuned without a redeploy:
const DEFAULT_BASE_FEE = 300 // ₦ — minimum charge for any errand, covers a runner's time even for a short trip
const DEFAULT_FEE_PER_KM = 100 // ₦ per km beyond the base

function getBaseFee() {
  const raw = process.env.ERRAND_BASE_FEE
  const parsed = Number(raw)
  return raw !== undefined && raw !== "" && !Number.isNaN(parsed) && parsed >= 0
    ? parsed
    : DEFAULT_BASE_FEE
}

function getFeePerKm() {
  const raw = process.env.ERRAND_FEE_PER_KM
  const parsed = Number(raw)
  return raw !== undefined && raw !== "" && !Number.isNaN(parsed) && parsed >= 0
    ? parsed
    : DEFAULT_FEE_PER_KM
}

// Haversine great-circle distance in km between two {lat, lng} points.
function distanceKm(a, b) {
  if (!a || !b || typeof a.lat !== "number" || typeof a.lng !== "number" || typeof b.lat !== "number" || typeof b.lng !== "number") {
    return 0
  }
  const R = 6371 // Earth radius, km
  const toRad = (deg) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
  return R * c
}

// Computes { distanceKm, errandFee } for an order.
// If drop-off coordinates weren't captured (many errands — e.g. a bank
// queue — have no separate drop-off), we can't measure a distance, so the
// runner still earns the base fee for their time rather than nothing.
function computeErrandFee(pickup, dropoff) {
  const km = distanceKm(pickup, dropoff)
  const fee = Math.round(getBaseFee() + km * getFeePerKm())
  return { distanceKm: Math.round(km * 10) / 10, errandFee: fee }
}

module.exports = { computeErrandFee, distanceKm, getBaseFee, getFeePerKm }