import { useState } from "react"
import { Power } from "lucide-react"
import api from "../lib/api"

export default function AvailabilityToggle({ isAvailable, onChange, disabled }) {
  const [busy, setBusy] = useState(false)

  const handleToggle = async () => {
    setBusy(true)
    try {
      const { data } = await api.patch("/runners/toggle-availability")
      onChange(data.data.isAvailable)
    } catch {
      // silently ignore — UI just won't flip; the underlying state is
      // still whatever the server had before this tap
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={disabled || busy}
      className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50"
      style={{
        background: isAvailable ? "var(--color-amber)" : "transparent",
        border: `1.5px solid ${isAvailable ? "var(--color-amber)" : "var(--color-hairline)"}`,
        color: isAvailable ? "#1a1206" : "var(--color-faint)",
      }}
    >
      <Power size={13} strokeWidth={2.5} />
      {isAvailable ? "ONLINE" : "OFFLINE"}
    </button>
  )
}