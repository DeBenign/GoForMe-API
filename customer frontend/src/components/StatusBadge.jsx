const TONE = {
  pending: "warn",
  accepted: "info",
  in_progress: "info",
  completed: "good",
  cancelled: "bad",
  open: "warn",
  under_review: "info",
  resolved: "good",
  closed: "faint",
}

const STYLES = {
  good: "text-good bg-good-dim border-good/30",
  bad: "text-bad bg-bad-dim border-bad/30",
  warn: "text-warn bg-warn-dim border-warn/30",
  info: "text-info bg-info-dim border-info/30",
  faint: "text-faint bg-panel-raised border-hairline",
}

export default function StatusBadge({ status, label }) {
  const tone = TONE[status] || "faint"
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${STYLES[tone]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label || (status || "unknown").replaceAll("_", " ")}
    </span>
  )
}
