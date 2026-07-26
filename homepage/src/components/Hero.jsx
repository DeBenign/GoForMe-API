import { ArrowRight, MapPin } from "lucide-react"
import { APPS } from "../apps"

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-panel">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.05fr_1fr] lg:items-center">
        <div className="animate-rise">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-hairline bg-base px-3 py-1 text-xs font-medium text-muted">
            <MapPin size={12} className="text-amber" />
            Built for Abuja, errand by errand
          </div>
          <h1 className="font-display text-4xl font-bold leading-[1.08] text-ink sm:text-5xl lg:text-6xl">
            Send someone.
            <br />
            Skip the queue.
          </h1>
          <p className="mt-5 max-w-md text-base text-muted sm:text-lg">
            Groceries, pharmacy runs, bank queues, office drop-offs. Post what you need — GoForMe
            finds the nearest runner automatically. No browsing, no haggling.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={APPS.customer.url} className="btn-primary">
              Post an errand <ArrowRight size={16} />
            </a>
            <a href={APPS.runner.url} className="btn-secondary">
              Become a runner
            </a>
          </div>
        </div>

        {/* The signature element: this homepage's hero IS an errand ticket —
            the same paper-stub motif used inside the customer/runner apps
            for every real order, blown up and stamped for the first thing
            a visitor sees. */}
        <div className="relative mx-auto w-full max-w-sm">
          <div className="ticket-edge-top ticket-edge-bottom rounded-2xl bg-panel px-6 pb-8 pt-7 shadow-xl shadow-ink/10">
            <div className="flex items-start justify-between border-b border-dashed border-hairline pb-4">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-faint">Errand ticket</div>
                <div className="font-mono text-sm font-semibold text-ink">#GFM-000128</div>
              </div>
              <div className="animate-stamp rounded border-2 border-good px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-good">
                Dispatched
              </div>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div>
                <div className="text-[11px] uppercase tracking-wide text-faint">Category</div>
                <div className="font-medium text-ink">Pharmacy pickup</div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-faint">Pickup</div>
                <div className="text-ink">MedPlus, Ahmadu Bello Way</div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-faint">Runner</div>
                <div className="flex items-center gap-1.5 text-ink">
                  <span className="h-1.5 w-1.5 rounded-full bg-good animate-pulse-dot" />
                  Nearest available — auto-matched
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-dashed border-hairline pt-3 font-mono">
                <span className="text-faint">Item budget + errand fee</span>
                <span className="font-semibold text-ink">₦2,500 + ₦480</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}