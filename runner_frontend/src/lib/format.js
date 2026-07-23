export function formatNaira(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return "₦0"
  return "₦" + Number(amount).toLocaleString("en-NG", { maximumFractionDigits: 2 })
}

export function formatDate(dateStr) {
  if (!dateStr) return "—"
  const d = new Date(dateStr)
  return d.toLocaleString("en-NG", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
}

export function formatTime(dateStr) {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })
}

export function shortId(id) {
  if (!id) return "—"
  return id.slice(-6).toUpperCase()
}

export const STATUS_COPY = {
  pending: "Awaiting match",
  accepted: "Assigned to you — head to pickup",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
}