export default function Pagination({ page, totalPages, onChange }) {
  if (!totalPages || totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between border-t border-hairline px-4 py-3">
      <span className="text-xs text-faint font-mono">
        Page {page} of {totalPages}
      </span>
      <div className="flex gap-2">
        <button
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className="rounded-md border border-hairline px-3 py-1 text-xs font-medium text-muted hover:text-ink hover:border-faint disabled:opacity-30 disabled:pointer-events-none"
        >
          Prev
        </button>
        <button
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          className="rounded-md border border-hairline px-3 py-1 text-xs font-medium text-muted hover:text-ink hover:border-faint disabled:opacity-30 disabled:pointer-events-none"
        >
          Next
        </button>
      </div>
    </div>
  )
}
