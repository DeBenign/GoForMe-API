import { PenLine, Zap, Wallet } from "lucide-react"

const STEPS = [
  {
    n: "01",
    icon: PenLine,
    title: "Post what you need",
    body: "Groceries, a prescription, a bank queue, documents to drop off. Tell us what it is, where, and your budget for it.",
  },
  {
    n: "02",
    icon: Zap,
    title: "We auto-dispatch a runner",
    body: "No browsing profiles, no waiting for someone to accept. The nearest approved runner gets matched to your errand automatically.",
  },
  {
    n: "03",
    icon: Wallet,
    title: "Pay from your wallet",
    body: "Your item budget and the runner's fee are held until the errand is done — then it settles. Simple, and you can see the split.",
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
      <div className="mb-12 max-w-lg">
        <div className="mb-2 font-mono text-xs uppercase tracking-widest text-amber">How it works</div>
        <h2 className="font-display text-3xl font-bold text-ink sm:text-4xl">
          Three steps. No back-and-forth.
        </h2>
      </div>

      <div className="grid gap-8 sm:grid-cols-3 sm:gap-6">
        {STEPS.map((s) => (
          <div key={s.n} className="relative">
            <div className="mb-4 flex items-center gap-3">
              <span className="font-mono text-3xl font-bold text-hairline">{s.n}</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-dim text-amber">
                <s.icon size={16} />
              </div>
            </div>
            <h3 className="font-display text-lg font-semibold text-ink">{s.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}