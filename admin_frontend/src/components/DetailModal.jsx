import { X } from "lucide-react"

// Shared shell for detail modals (user / runner) — matches the existing
// override-order / resolve-dispute modal style already used elsewhere in
// the admin console.
export default function DetailModal({ title, subtitle, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-lg border border-hairline bg-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-hairline bg-panel px-5 py-3.5">
          <div>
            <h3 className="text-sm font-semibold text-ink">{title}</h3>
            {subtitle && <p className="text-xs text-faint">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-faint hover:text-ink">
            <X size={16} />
          </button>
        </div>
        <div className="space-y-4 px-5 py-4">{children}</div>
      </div>
    </div>
  )
}

// Small labeled row used throughout both detail modals.
export function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1 text-sm">
      <span className="text-faint">{label}</span>
      <span className="text-right text-ink">{value ?? "—"}</span>
    </div>
  )
}

export function DetailSection({ title, children }) {
  return (
    <div className="rounded-md border border-hairline bg-panel-raised p-3">
      <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">{title}</div>
      {children}
    </div>
  )
}