import { Info, CheckCircle2, AlertTriangle, AlertCircle, X } from "lucide-react"

// Reusable inline banner for form errors/success/info — replaces the
// hand-rolled `<div className="rounded-md border ... bg-bad-dim ...">`
// that was being repeated on nearly every form across the app.
const VARIANTS = {
  info: { icon: Info, text: "text-info", bg: "bg-info-dim", border: "border-info/30" },
  success: { icon: CheckCircle2, text: "text-good", bg: "bg-good-dim", border: "border-good/30" },
  warning: { icon: AlertTriangle, text: "text-warn", bg: "bg-warn-dim", border: "border-warn/30" },
  error: { icon: AlertCircle, text: "text-bad", bg: "bg-bad-dim", border: "border-bad/30" },
}

export default function Alert({ type = "info", message, onClose }) {
  if (!message) return null
  const { icon: Icon, text, bg, border } = VARIANTS[type] || VARIANTS.info
  return (
    <div className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-xs ${bg} ${border} ${text}`}>
      <Icon size={14} className="mt-0.5 shrink-0" />
      <p className="flex-1">{message}</p>
      {onClose && (
        <button onClick={onClose} className="shrink-0 opacity-60 hover:opacity-100">
          <X size={12} />
        </button>
      )}
    </div>
  )
}