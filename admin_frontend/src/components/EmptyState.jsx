export default function EmptyState({ icon: Icon, title, sub }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      {Icon && (
        <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-panel-raised text-faint">
          <Icon size={18} />
        </div>
      )}
      <div className="text-sm font-medium text-muted">{title}</div>
      {sub && <div className="max-w-xs text-xs text-faint">{sub}</div>}
    </div>
  )
}
