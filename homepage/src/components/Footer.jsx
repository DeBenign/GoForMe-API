import { APPS } from "../apps"

export default function Footer() {
  return (
    <footer className="border-t border-hairline">
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xs">
            <div className="flex items-center gap-2">
              <img src="/goforme-mark.svg" alt="" className="h-6 w-6" />
              <span className="font-display text-base font-bold text-ink">GoForMe</span>
            </div>
            <p className="mt-2 text-sm text-faint">Send someone. Skip the queue. Abuja's errand marketplace.</p>
          </div>

          <div className="flex gap-12">
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-faint">Log in</div>
              <ul className="space-y-1.5 text-sm">
                {Object.entries(APPS).map(([key, app]) => (
                  <li key={key}>
                    <a href={app.url} className="text-muted hover:text-ink">{app.label}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-faint">Site</div>
              <ul className="space-y-1.5 text-sm">
                <li><a href="#how-it-works" className="text-muted hover:text-ink">How it works</a></li>
                <li><a href="#about" className="text-muted hover:text-ink">About</a></li>
                <li><a href="#contact" className="text-muted hover:text-ink">Contact</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-hairline pt-6 text-xs text-faint">
          © {new Date().getFullYear()} GoForMe. All rights reserved.
        </div>
      </div>
    </footer>
  )
}