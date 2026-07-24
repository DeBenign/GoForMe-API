// config/commission.js
//
// Platform commission rate taken out of every completed errand, as a
// fraction of what the customer pays (0.15 = 15%). Configurable via env
// so it can be tuned without a redeploy of application logic — falls
// back to a sane default if unset or malformed.
const DEFAULT_RATE = 0.15

function getCommissionRate() {
  const raw = process.env.COMMISSION_RATE
  if (raw === undefined || raw === "") return DEFAULT_RATE

  const parsed = Number(raw)
  if (Number.isNaN(parsed) || parsed < 0 || parsed >= 1) return DEFAULT_RATE

  return parsed
}

// Splits a charge amount into { commissionRate, commissionAmount, runnerPayout }.
// Commission is rounded to the nearest naira; the runner gets the remainder
// so the two always sum back to the exact chargeAmount (no naira lost or
// invented to rounding).
function splitCommission(chargeAmount) {
  const commissionRate = getCommissionRate()
  const commissionAmount = Math.round(chargeAmount * commissionRate)
  const runnerPayout = chargeAmount - commissionAmount
  return { commissionRate, commissionAmount, runnerPayout }
}

module.exports = { getCommissionRate, splitCommission }