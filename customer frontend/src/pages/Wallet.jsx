import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Wallet as WalletIcon, Plus, X, ArrowDownLeft, ArrowUpRight } from "lucide-react"
import api from "../lib/api"
import TopBar from "../components/TopBar"
import Spinner from "../components/Spinner"
import EmptyState from "../components/EmptyState"
import { formatDate, formatNaira } from "../lib/format"

function FundModal({ onClose }) {
  const [amount, setAmount] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const handleFund = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const { data } = await api.post("/wallet/fund", { amount: Number(amount) })
      const authUrl = data.data?.authorization_url
      if (authUrl) {
        window.location.href = authUrl
      } else {
        setError("Couldn't start the payment. Try again.")
      }
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't start the payment.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-hairline bg-panel p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink">Top up wallet</h3>
          <button onClick={onClose} className="text-faint hover:text-ink">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleFund}>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm text-faint">₦</span>
            <input
              type="number"
              min="100"
              required
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="5000"
              className="w-full rounded-lg border border-hairline bg-panel-raised py-2.5 pl-8 pr-3.5 font-mono text-sm text-ink placeholder:text-faint focus:border-amber focus:outline-none"
            />
          </div>
          <div className="mt-3 flex gap-2">
            {[1000, 2500, 5000, 10000].map((v) => (
              <button
                type="button"
                key={v}
                onClick={() => setAmount(String(v))}
                className="flex-1 rounded-lg border border-hairline py-1.5 text-xs font-medium text-muted hover:text-ink"
              >
                ₦{v.toLocaleString()}
              </button>
            ))}
          </div>
          {error && (
            <div className="mt-3 rounded-lg border border-bad/30 bg-bad-dim px-3 py-2 text-xs text-bad">{error}</div>
          )}
          <button
            type="submit"
            disabled={saving}
            className="mt-4 w-full rounded-lg bg-amber py-3 text-sm font-semibold text-[#1a1206] hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Redirecting to Paystack…" : "Continue to payment"}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function Wallet() {
  const [wallet, setWallet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showFund, setShowFund] = useState(false)
  const [verifyMsg, setVerifyMsg] = useState(null)
  const [searchParams, setSearchParams] = useSearchParams()

  const loadWallet = () => {
    api
      .get("/wallet/me")
      .then((res) => setWallet(res.data.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const reference = searchParams.get("reference") || searchParams.get("trxref")
    if (reference) {
      api
        .get("/wallet/verify", { params: { reference } })
        .then((res) => {
          setVerifyMsg({ ok: true, text: `Wallet funded — new balance ${formatDate ? "" : ""}₦${res.data.balance?.toLocaleString()}` })
        })
        .catch((err) => {
          setVerifyMsg({ ok: false, text: err.response?.data?.message || "Couldn't verify that payment." })
        })
        .finally(() => {
          searchParams.delete("reference")
          searchParams.delete("trxref")
          setSearchParams(searchParams, { replace: true })
          loadWallet()
        })
    } else {
      loadWallet()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const transactions = [...(wallet?.transactions || [])].reverse()

  return (
    <div>
      <TopBar title="Wallet" />
      <div className="px-5 py-5">
        {verifyMsg && (
          <div
            className={`mb-4 rounded-lg border px-3 py-2 text-xs ${
              verifyMsg.ok ? "border-good/30 bg-good-dim text-good" : "border-bad/30 bg-bad-dim text-bad"
            }`}
          >
            {verifyMsg.text}
          </div>
        )}

        <div className="rounded-2xl border border-hairline bg-panel p-5">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-faint">
            <WalletIcon size={13} /> Balance
          </div>
          <div className="mt-1.5 font-mono text-3xl font-semibold text-ink">
            {loading ? "…" : formatNaira(wallet?.balance)}
          </div>
          <button
            onClick={() => setShowFund(true)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-amber py-3 text-sm font-semibold text-[#1a1206] hover:opacity-90"
          >
            <Plus size={16} /> Top up wallet
          </button>
        </div>

        <h2 className="mb-3 mt-6 text-sm font-semibold text-ink">Transaction history</h2>
        {loading ? (
          <Spinner label="Loading transactions…" />
        ) : transactions.length === 0 ? (
          <div className="rounded-2xl border border-hairline bg-panel">
            <EmptyState title="No transactions yet" />
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-hairline bg-panel divide-y divide-hairline">
            {transactions.map((t, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    t.type === "credit" ? "bg-good-dim text-good" : "bg-bad-dim text-bad"
                  }`}
                >
                  {t.type === "credit" ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-ink">{t.reason || "Wallet transaction"}</div>
                  <div className="text-xs text-faint">{formatDate(t.createdAt)}</div>
                </div>
                <div className={`font-mono text-sm font-medium ${t.type === "credit" ? "text-good" : "text-bad"}`}>
                  {t.type === "credit" ? "+" : "-"}
                  {formatNaira(t.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showFund && <FundModal onClose={() => setShowFund(false)} />}
    </div>
  )
}
