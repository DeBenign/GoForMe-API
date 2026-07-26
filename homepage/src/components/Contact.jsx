import { Mail, Phone, MapPin } from "lucide-react"

// NOTE: placeholders — swap these for GoForMe's real contact details before
// deploying. Kept obviously generic rather than inventing a fake address.
const CONTACT = {
  email: "hello@goforme.ng",
  phone: "+234 000 000 0000",
  city: "Abuja, Nigeria",
}

export default function Contact() {
  return (
    <section id="contact" className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
      <div className="mb-12 max-w-lg">
        <div className="mb-2 font-mono text-xs uppercase tracking-widest text-amber">Contact</div>
        <h2 className="font-display text-3xl font-bold text-ink sm:text-4xl">Talk to us</h2>
        <p className="mt-3 text-sm text-muted">
          Questions about an errand, a partnership, or joining as a runner — reach out directly.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <a href={`mailto:${CONTACT.email}`} className="flex items-center gap-3 rounded-xl border border-hairline p-5 hover:border-amber">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-dim text-amber">
            <Mail size={16} />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-faint">Email</div>
            <div className="text-sm font-medium text-ink">{CONTACT.email}</div>
          </div>
        </a>
        <a href={`tel:${CONTACT.phone.replace(/\s/g, "")}`} className="flex items-center gap-3 rounded-xl border border-hairline p-5 hover:border-amber">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-dim text-amber">
            <Phone size={16} />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-faint">Phone</div>
            <div className="text-sm font-medium text-ink">{CONTACT.phone}</div>
          </div>
        </a>
        <div className="flex items-center gap-3 rounded-xl border border-hairline p-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-dim text-amber">
            <MapPin size={16} />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-faint">Based in</div>
            <div className="text-sm font-medium text-ink">{CONTACT.city}</div>
          </div>
        </div>
      </div>
    </section>
  )
}