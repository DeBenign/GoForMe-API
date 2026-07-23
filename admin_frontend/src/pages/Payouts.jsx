import { useEffect, useState } from "react"
import { Banknote } from "lucide-react"
import api from "../lib/api"
import PageHeader from "../components/PageHeader"
import Spinner from "../components/Spinner"
import EmptyState from "../components/EmptyState"
import StatusBadge from "../components/StatusBadge"
import Pagination from "../components/Pagination"
import { formatDate, formatNaira } from "../lib/format"

const STATUSES = ["pending", "processing", "success", "failed", "reversed"]

export default function Payouts() {
  const [payouts, setPayouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [status, setStatus] = useState("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    setLoading(true)
    api
      .get("/admin/payouts", { params: { page, limit: 15, ...(status !== "all" && { status }) } })
      .then((res) => {
        setPayouts(res.data.data || [])
        setTotalPages(res.data.totalPages || 1)
      })
      .catch((err) => setError(err.response?.data?.message || "Couldn't load payouts."))
      .finally(() => setLoading(false))
  }, [status, page])

  const handleStatusChange = (s) => {
    setStatus(s)
    setPage(1)
  }

  return (
    <div>
      <PageHeader title="Payouts" sub="Runner bank transfers via Paystack" />

      <div className="mb-4 flex flex-wrap gap-1 rounded-md border border-hairline bg-panel p-1 w-fit">
        {["all", ...STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => handleStatusChange(s)}
            className={`rounded px-3 py-1 text-xs font-medium capitalize transition-colors ${
              status === s ? "bg-amber-dim text-amber" : "text-muted hover:text-ink"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner label="Loading payouts…" />
      ) : error ? (
        <div className="rounded-md border border-bad/30 bg-bad-dim p-4 text-sm text-bad">{error}</div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-hairline bg-panel">
          {payouts.length === 0 ? (
            <EmptyState icon={Banknote} title="No payouts in this state" />
          ) : (
            <>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-hairline text-xs uppercase tracking-wide text-faint">
                    <th className="px-4 py-3 font-medium">Reference</th>
                    <th className="px-4 py-3 font-medium">Runner</th>
                    <th className="px-4 py-3 font-medium">Bank</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Initiated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {payouts.map((p) => (
                    <tr key={p._id} className="hover:bg-panel-raised">
                      <td className="px-4 py-3 font-mono text-xs text-muted">{p.reference}</td>
                      <td className="px-4 py-3 text-ink">
                        {p.user_id?.name || "—"}
                        <div className="text-xs text-faint">{p.user_id?.phone}</div>
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {p.bank_name}
                        <div className="text-xs text-faint font-mono">{p.account_name}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-ink">{formatNaira(p.amount)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={p.status} />
                        {p.failure_reason && (
                          <div className="mt-1 max-w-[180px] text-xs text-bad">{p.failure_reason}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-faint font-mono">
                        {formatDate(p.initiated_at || p.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </>
          )}
        </div>
      )}
    </div>
  )
}
