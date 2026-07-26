import { ShoppingBasket, Pill, FileText, UtensilsCrossed, Landmark, Building2 } from "lucide-react"

const CATEGORIES = [
  { icon: ShoppingBasket, label: "Grocery", body: "Market or supermarket runs, done for you." },
  { icon: Pill, label: "Pharmacy", body: "Prescription pickups, no queue in person." },
  { icon: Landmark, label: "Bank", body: "Someone else stands in that line." },
  { icon: Building2, label: "Office", body: "Drop-offs and pickups between offices." },
  { icon: FileText, label: "Documents", body: "Paperwork that needs to move today." },
  { icon: UtensilsCrossed, label: "Food", body: "From a specific spot, not an app menu." },
]

export default function Categories() {
  return (
    <section className="bg-panel">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="mb-12 max-w-lg">
          <div className="mb-2 font-mono text-xs uppercase tracking-widest text-amber">What we run</div>
          <h2 className="font-display text-3xl font-bold text-ink sm:text-4xl">
            If it's an errand, it's an errand.
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((c) => (
            <div key={c.label} className="rounded-xl border border-hairline bg-base p-5">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-amber-dim text-amber">
                <c.icon size={16} />
              </div>
              <div className="font-display text-base font-semibold text-ink">{c.label}</div>
              <p className="mt-1 text-sm text-muted">{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}