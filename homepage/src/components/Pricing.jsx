import { Check } from "lucide-react"

const POINTS = [
  "Your item budget goes to the errand itself — groceries, meds, whatever it is — never touched by any fee.",
  "The runner's fee is calculated from the actual distance between pickup and drop-off, not a guess.",
  "You see both numbers before you post — no surprise total at the end.",
]

export default function Pricing() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
        <div>
          <div className="mb-2 font-mono text-xs uppercase tracking-widest text-amber">Pricing</div>
          <h2 className="font-display text-3xl font-bold text-ink sm:text-4xl">
            You always know where the money goes.
          </h2>
          <ul className="mt-6 space-y-3">
            {POINTS.map((p) => (
              <li key={p} className="flex gap-3 text-sm text-muted">
                <Check size={16} className="mt-0.5 shrink-0 text-good" />
                {p}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-hairline bg-panel p-6">
          <div className="mb-4 text-xs uppercase tracking-wide text-faint">Example — pharmacy pickup, 2.3km away</div>
          <div className="space-y-3 font-mono text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Item budget</span>
              <span className="text-ink">₦2,500</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Errand fee (distance-based)</span>
              <span className="text-ink">₦530</span>
            </div>
            <div className="flex justify-between border-t border-dashed border-hairline pt-3 font-semibold">
              <span className="text-ink">Total, held in your wallet</span>
              <span className="text-ink">₦3,030</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}