export function formatNaira(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return "₦0"
  return "₦" + Number(amount).toLocaleString("en-NG", { maximumFractionDigits: 2 })
}

export function formatDate(dateStr) {
  if (!dateStr) return "—"
  const d = new Date(dateStr)
  return d.toLocaleString("en-NG", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function shortId(id) {
  if (!id) return "—"
  return id.slice(-6).toUpperCase()
}

export function initials(name) {
  if (!name) return "?"
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}
