import { useEffect, useRef, useState } from "react"
import { ChevronDown } from "lucide-react"
import { APPS } from "../apps"

export default function Header() {
  const [loginsOpen, setLoginsOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setLoginsOpen(false)
    }
    document.addEventListener("click", onClick)
    return () => document.removeEventListener("click", onClick)
  }, [])

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-base/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
        <a href="#top" className="flex items-center gap-2">
          <img src="/goforme-mark.svg" alt="" className="h-7 w-7" />
          <span className="font-display text-lg font-bold text-ink">GoForMe</span>
        </a>

        <nav className="hidden items-center gap-7 text-sm font-medium text-muted sm:flex">
          <a href="#how-it-works" className="hover:text-ink">How it works</a>
          <a href="#about" className="hover:text-ink">About</a>
          <a href="#contact" className="hover:text-ink">Contact</a>
        </nav>

        <div className="relative" ref={ref}>
          <button
            onClick={() => setLoginsOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg border border-hairline px-3.5 py-2 text-sm font-medium text-ink hover:border-amber"
          >
            Log in
            <ChevronDown size={14} className={`transition-transform ${loginsOpen ? "rotate-180" : ""}`} />
          </button>

          {loginsOpen && (
            <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-lg border border-hairline bg-base shadow-lg shadow-ink/5">
              {Object.entries(APPS).map(([key, app]) => (
                <a
                  key={key}
                  href={app.url}
                  className="flex flex-col px-4 py-2.5 hover:bg-panel"
                >
                  <span className="text-sm font-medium text-ink">{app.label}</span>
                  <span className="text-xs text-faint">{app.blurb}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}