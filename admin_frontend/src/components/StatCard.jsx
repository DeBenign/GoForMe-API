export default function StatCard({ label, value, sub, accent = false }) {
  return (
    <div className="rounded-lg border border-hairline bg-panel p-4">
      <div className="text-xs uppercase tracking-wider text-muted font-medium">{label}</div>
      <div
        className={`mt-2 font-display text-2xl font-semibold ${accent ? "text-amber" : "text-ink"}`}
      >
        {value}
      </div>
      {sub && <div className="mt-1 text-xs text-faint font-mono">{sub}</div>}
    </div>
  )
}
