import { useState, useEffect } from "react"
import { Banknote, CheckCircle2, History } from "lucide-react"
import api from "../lib/api"
import { formatNaira, formatDate } from "../lib/format"
import { useRunnerProfile } from "../context/RunnerProfileContext"
import TopBar from "../components/TopBar"
import StatusBadge from "../components/StatusBadge"
import EmptyState from "../components/EmptyState"
import Spinner from "../components/Spinner"

export default function Payouts() {
  const { runner, refresh: refreshProfile } = useRunnerProfile()
  const [banks, setBanks] = useState([])
  const [bankCode, setBankCode] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [verifiedName, setVerifiedName] = useState(null)
  const [verifying, setVerifying] = useState(false)
  const [saving, setSaving] = useState(false)
  const [amount, setAmount] = useState("")
  const [requesting, setRequesting] = useState(false)
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  const hasBank = !!runner?.bank_details?.recipient_code

  useEffect(() => {
    api.get("/payouts/banks").then(({ data }) => setBanks(data.data || [])).catch(() => {})
    api
      .get("/payouts/history")
      .then(({ data }) => setHistory(data.data || []))
      .catch(() => {})
      .finally(() => setLoadingHistory(false))
  }, [])

  const handleVerify = async () => {
    setError(null)
    setVerifying(true)
    try {
      const { data } = await api.post("/payouts/verify-account", {
        account_number: accountNumber,
        bank_code: bankCode,
      })
      setVerifiedName(data.account_name)
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't verify that account.")
    } finally {
      setVerifying(false)
    }
  }

  const handleSaveBank = async () => {
    setError(null)
    setSaving(true)
    const bank = banks.find((b) => b.code === bankCode)
    try {
      await api.post("/payouts/save-bank", {
        account_number: accountNumber,
        bank_code: bankCode,
        bank_name: bank?.name || "",
        account_name: verifiedName,
      })
      await refreshProfile()
      setMessage("Bank details saved.")
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't save your bank details.")
    } finally {
      setSaving(false)
    }
  }

  const handleRequestPayout = async (e) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setRequesting(true)
    try {
      const { data } = await api.post("/payouts/request", { amount: Number(amount) })
      setMessage(data.message)
      setAmount("")
      await Promise.all([
        refreshProfile(),
        api.get("/payouts/history").then(({ data }) => setHistory(data.data || [])),
      ])
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't request a payout.")
    } finally {
      setRequesting(false)
    }
  }

  return (
    <div className="min-h-screen bg-base">
      <TopBar title="Payouts" />
      <div className="mx-auto max-w-md px-5 py-5 space-y-5">
        <div className="rounded-xl border border-hairline bg-panel px-4 py-3.5 text-center">
          <div className="text-[10px] uppercase tracking-widest text-faint">Available to withdraw</div>
          <div className="mt-1 font-mono text-2xl font-semibold text-good">
            {formatNaira(runner?.totalEarnings)}
          </div>
        </div>

        {message && (
          <div className="rounded-lg border border-good/30 bg-good-dim px-3 py-2 text-xs text-good">{message}</div>
        )}
        {error && (
          <div className="rounded-lg border border-bad/30 bg-bad-dim px-3 py-2 text-xs text-bad">{error}</div>
        )}

        {/* Bank setup */}
        {!hasBank ? (
          <div className="rounded-2xl border border-hairline bg-panel p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
              <Banknote size={15} className="text-amber" /> Add your bank details
            </h3>
            <select
              value={bankCode}
              onChange={(e) => { setBankCode(e.target.value); setVerifiedName(null) }}
              className="mb-3 w-full rounded-lg border border-hairline bg-panel-raised px-3.5 py-2.5 text-sm text-ink focus:border-amber focus:outline-none"
            >
              <option value="">Select your bank</option>
              {banks.map((b) => (
                <option key={b.code} value={b.code}>{b.name}</option>
              ))}
            </select>
            <input
              value={accountNumber}
              onChange={(e) => { setAccountNumber(e.target.value); setVerifiedName(null) }}
              placeholder="Account number"
              className="mb-3 w-full rounded-lg border border-hairline bg-panel-raised px-3.5 py-2.5 text-sm text-ink placeholder:text-faint focus:border-amber focus:outline-none"
            />

            {verifiedName ? (
              <div className="mb-3 flex items-center gap-2 rounded-lg border border-good/30 bg-good-dim px-3 py-2 text-xs text-good">
                <CheckCircle2 size={14} /> {verifiedName}
              </div>
            ) : (
              <button
                onClick={handleVerify}
                disabled={!bankCode || !accountNumber || verifying}
                className="mb-3 w-full rounded-lg border border-hairline py-2.5 text-sm font-medium text-muted transition-colors hover:border-amber hover:text-amber disabled:opacity-50"
              >
                {verifying ? "Verifying…" : "Verify account"}
              </button>
            )}

            <button
              onClick={handleSaveBank}
              disabled={!verifiedName || saving}
              className="w-full rounded-lg bg-amber py-2.5 text-sm font-semibold text-[#1a1206] transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save bank details"}
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-hairline bg-panel p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
              <Banknote size={15} className="text-amber" /> Request a payout
            </h3>
            <div className="mb-3 text-xs text-muted">
              {runner.bank_details.account_name} · {runner.bank_details.bank_name} · ····{runner.bank_details.account_number.slice(-4)}
            </div>
            <form onSubmit={handleRequestPayout}>
              <input
                type="number"
                min={500}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount (min ₦500)"
                className="mb-3 w-full rounded-lg border border-hairline bg-panel-raised px-3.5 py-2.5 text-sm text-ink placeholder:text-faint focus:border-amber focus:outline-none"
              />
              <button
                type="submit"
                disabled={requesting || !amount}
                className="w-full rounded-lg bg-amber py-2.5 text-sm font-semibold text-[#1a1206] transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {requesting ? "Requesting…" : "Request payout"}
              </button>
            </form>
          </div>
        )}

        {/* History */}
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
            <History size={15} className="text-faint" /> Payout history
          </h3>
          {loadingHistory ? (
            <Spinner label="Loading history…" />
          ) : history.length === 0 ? (
            <EmptyState icon={History} title="No payouts yet" sub="Your withdrawal history will show up here." />
          ) : (
            <div className="space-y-2">
              {history.map((p) => (
                <div key={p._id} className="flex items-center justify-between rounded-xl border border-hairline bg-panel px-4 py-3">
                  <div>
                    <div className="font-mono text-sm font-semibold text-ink">{formatNaira(p.amount)}</div>
                    <div className="text-[11px] text-faint">{formatDate(p.createdAt)}</div>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}