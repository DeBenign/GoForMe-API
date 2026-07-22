import { Radio } from "lucide-react"

export default function TopBar({ title, right }) {
  return (
    <div className="sticky top-0 z-30 border-b border-hairline bg-base/90 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-between px-5 py-3.5">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-amber-dim text-amber">
            <Radio size={13} strokeWidth={2.5} />
          </div>
          <span className="font-display text-sm font-semibold text-ink">{title || "GoForMe"}</span>
        </div>
        {right}
      </div>
    </div>
  )
}
