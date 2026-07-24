import { useEffect, useState } from "react"
import { Gift, Copy, Check } from "lucide-react"
import api from "../lib/api"

export default function ReferralCard() {
  const [info, setInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [applyCode, setApplyCode] = useState("")
  const [applyBusy, setApplyBusy] = useState(false)
  const [applyMessage, setApplyMessage] = useState(null)

  useEffect(() => {
    let cancelled = false
    api
      .get("/referrals/me")
      .then(({ data }) => {
        if (!cancelled) setInfo(data)
      })
      .catch(() => {
        // referral info isn't essential — fail quietly
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleCopy = async () => {
    if (!info?.code) return
    try {
      await navigator.clipboard.writeText(info.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard access denied — nothing more we can do
    }
  }

  const handleApply = async (e) => {
    e.preventDefault()
    if (!applyCode.trim()) return
    setApplyBusy(true)
    setApplyMessage(null)
    try {
      await api.post("/referrals/apply", { code: applyCode.trim().toUpperCase() })
      setApplyMessage({ ok: true, text: "Code applied — you'll both get credit once your first errand is done." })
      setApplyCode("")
    } catch (err) {
      setApplyMessage({ ok: false, text: err.response?.data?.error || "Couldn't apply that code." })
    } finally {
      setApplyBusy(false)
    }
  }

  if (loading) return null

  return (
    <div className="rounded-2xl border border-hairline bg-panel p-5">
      <div className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-ink">
        <Gift size={15} className="text-amber" />
        Refer & earn
      </div>

      {info?.code && (
        <>
          <p className="mb-2 text-xs text-muted">{info.shareMessage}</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-lg border border-dashed border-amber/40 bg-amber-dim px-3.5 py-2.5 text-center font-mono text-sm font-semibold tracking-widest text-amber">
              {info.code}
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-hairline text-muted hover:text-ink"
            >
              {copied ? <Check size={15} className="text-good" /> : <Copy size={15} />}
            </button>
          </div>
          {info.stats && (
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <div className="font-mono font-semibold text-ink">{info.stats.pending}</div>
                <div className="text-faint">Pending</div>
              </div>
              <div>
                <div className="font-mono font-semibold text-ink">{info.stats.qualified}</div>
                <div className="text-faint">Qualified</div>
              </div>
              <div>
                <div className="font-mono font-semibold text-ink">{info.stats.rewarded}</div>
                <div className="text-faint">Rewarded</div>
              </div>
            </div>
          )}
        </>
      )}

      <form onSubmit={handleApply} className="mt-4 border-t border-hairline pt-4">
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">
          Have a friend's code?
        </label>
        <div className="flex gap-2">
          <input
            value={applyCode}
            onChange={(e) => setApplyCode(e.target.value.toUpperCase())}
            placeholder="Enter their code"
            className="flex-1 rounded-lg border border-hairline bg-panel-raised px-3.5 py-2.5 font-mono text-sm text-ink placeholder:text-faint placeholder:font-sans focus:border-amber focus:outline-none"
          />
          <button
            type="submit"
            disabled={applyBusy || !applyCode.trim()}
            className="shrink-0 rounded-lg bg-amber px-4 text-sm font-semibold text-[#1a1206] hover:opacity-90 disabled:opacity-50"
          >
            {applyBusy ? "Applying…" : "Apply"}
          </button>
        </div>
        {applyMessage && (
          <p className={`mt-1.5 text-xs ${applyMessage.ok ? "text-good" : "text-bad"}`}>{applyMessage.text}</p>
        )}
      </form>
    </div>
  )
}