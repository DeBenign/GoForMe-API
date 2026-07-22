import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import api from "../lib/api"

const REASONS = [
  { value: "item_not_delivered", label: "Item never delivered" },
  { value: "wrong_item", label: "Wrong item brought back" },
  { value: "runner_no_show", label: "Runner never showed up" },
  { value: "overcharged", label: "Overcharged for the errand" },
  { value: "damaged_item", label: "Item arrived damaged" },
  { value: "unfair_rating", label: "Unfair rating from runner" },
  { value: "other", label: "Something else" },
]

export default function DisputeNew() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get("orderId")
  const [reason, setReason] = useState("")
  const [description, setDescription] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await api.post("/disputes", { order_id: orderId, reason, description })
      navigate("/disputes", { state: { justFiled: true } })
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't file this report.")
    } finally {
      setSaving(false)
    }
  }

  if (!orderId) return <div className="p-5 text-sm text-bad">Missing errand reference — go back and try again.</div>

  return (
    <div>
      <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-hairline bg-base/90 px-5 py-3.5 backdrop-blur">
        <button onClick={() => navigate(-1)} className="text-faint hover:text-ink">
          <ArrowLeft size={18} />
        </button>
        <span className="font-display text-sm font-semibold text-ink">Report a problem</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 px-5 py-5">
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">
            What went wrong?
          </label>
          <div className="space-y-2">
            {REASONS.map((r) => (
              <button
                type="button"
                key={r.value}
                onClick={() => setReason(r.value)}
                className={`w-full rounded-lg border px-3.5 py-2.5 text-left text-sm transition-colors ${
                  reason === r.value
                    ? "border-amber bg-amber-dim text-amber"
                    : "border-hairline bg-panel text-muted hover:text-ink"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">
            Tell us more
          </label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Walk us through what happened so we can help quickly."
            className="w-full resize-none rounded-lg border border-hairline bg-panel px-3.5 py-2.5 text-sm text-ink placeholder:text-faint focus:border-amber focus:outline-none"
          />
        </div>

        {error && (
          <div className="rounded-lg border border-bad/30 bg-bad-dim px-3 py-2 text-xs text-bad">{error}</div>
        )}

        <button
          type="submit"
          disabled={saving || !reason}
          className="w-full rounded-lg bg-amber py-3.5 text-sm font-semibold text-[#1a1206] hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Filing report…" : "Submit report"}
        </button>
      </form>
    </div>
  )
}
