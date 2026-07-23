export default function EmptyState({ icon: Icon, title, sub, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
      {Icon && (
        <div className="mb-1 flex h-11 w-11 items-center justify-center rounded-full bg-panel-raised text-faint">
          <Icon size={20} />
        </div>
      )}
      <div className="text-sm font-medium text-muted">{title}</div>
      {sub && <div className="max-w-xs text-xs text-faint">{sub}</div>}
      {action}
    </div>
  )
}