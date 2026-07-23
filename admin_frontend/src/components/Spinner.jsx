export default function Spinner({ label = "Loading…" }) {
  return (
    <div className="flex items-center gap-2 py-16 justify-center text-sm text-faint">
      <span className="h-3 w-3 rounded-full bg-amber animate-pulse-dot" />
      {label}
    </div>
  )
}
