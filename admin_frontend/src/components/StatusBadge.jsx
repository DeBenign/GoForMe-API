// Maps every enum status across Order / Runner / Payout / Dispute / Payment
// models to a consistent visual tone, so a color always means the same
// thing wherever it appears in the console.
const TONE = {
  // orders
  pending: "warn",
  accepted: "info",
  in_progress: "info",
  completed: "good",
  cancelled: "bad",
  // runners / disputes shared
  approved: "good",
  rejected: "bad",
  open: "warn",
  under_review: "info",
  resolved: "good",
  closed: "faint",
  // payouts / payments
  processing: "info",
  success: "good",
  failed: "bad",
  reversed: "bad",
}

const STYLES = {
  good: "text-good bg-good-dim border-good/30",
  bad: "text-bad bg-bad-dim border-bad/30",
  warn: "text-warn bg-warn-dim border-warn/30",
  info: "text-info bg-info-dim border-info/30",
  faint: "text-faint bg-panel-raised border-hairline",
}

export default function StatusBadge({ status }) {
  const tone = TONE[status] || "faint"
  const label = (status || "unknown").replaceAll("_", " ")
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium font-mono lowercase tracking-wide ${STYLES[tone]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  )
}
