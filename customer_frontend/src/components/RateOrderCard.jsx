import { useState } from "react"
import { Star, CheckCircle2 } from "lucide-react"
import api from "../lib/api"

function StarPicker({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="p-0.5"
        >
          <Star
            size={26}
            className={n <= value ? "fill-amber text-amber" : "text-hairline"}
          />
        </button>
      ))}
    </div>
  )
}

// Two independent ratings, submitted together: how the runner did, and how
// the GoForMe experience itself was (matching speed, fee fairness, app
// usability) — these can differ, e.g. a great runner but a slow match, or
// a smooth app experience let down by a runner who was late.
export default function RateOrderCard({ order, runnerName, onRated }) {
  const [runnerStars, setRunnerStars] = useState(0)
  const [platformStars, setPlatformStars] = useState(0)
  const [comment, setComment] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async () => {
    if (runnerStars === 0 || platformStars === 0) {
      setError("Please rate both your runner and your GoForMe experience.")
      return
    }
    setSaving(true)
    setError(null)
    try {
      await api.post("/ratings", {
        orderId: order._id,
        stars: runnerStars,
        comment,
        platformStars,
      })
      onRated()
    } catch (err) {
      setError(err.response?.data?.error || "Couldn't submit your rating.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-2xl border border-hairline bg-panel p-4 space-y-4">
      <div className="text-sm font-semibold text-ink">Rate this errand</div>

      <div>
        <div className="mb-1.5 text-xs uppercase tracking-wide text-faint">
          {runnerName ? `How was ${runnerName}?` : "How was your runner?"}
        </div>
        <StarPicker value={runnerStars} onChange={setRunnerStars} />
      </div>

      <div>
        <div className="mb-1.5 text-xs uppercase tracking-wide text-faint">
          How was your GoForMe experience?
        </div>
        <StarPicker value={platformStars} onChange={setPlatformStars} />
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        placeholder="Anything you'd like to add? (optional)"
        className="w-full resize-none rounded-lg border border-hairline bg-panel-raised px-3 py-2 text-sm text-ink placeholder:text-faint focus:border-amber focus:outline-none"
      />

      {error && <p className="text-xs text-bad">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={saving}
        className="w-full rounded-lg bg-amber py-2.5 text-sm font-semibold text-[#1a1206] hover:opacity-90 disabled:opacity-50"
      >
        {saving ? "Submitting…" : "Submit rating"}
      </button>
    </div>
  )
}

export function RatedThanksCard() {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-good/30 bg-good-dim px-4 py-3 text-sm text-good">
      <CheckCircle2 size={16} />
      Thanks for rating this errand.
    </div>
  )
}