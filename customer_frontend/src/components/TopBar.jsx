export default function TopBar({ title, right }) {
  return (
    <div className="sticky top-0 z-30 border-b border-hairline bg-base/90 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-between px-5 py-3.5">
        <div className="flex items-center gap-2">
          <img src="/goforme-mark.svg" alt="" className="h-6 w-6" />
          <span className="font-display text-sm font-semibold text-ink">{title || "GoForMe"}</span>
        </div>
        {right}
      </div>
    </div>
  )
}