import { useEffect, useState } from "react"
import { ShieldAlert, X } from "lucide-react"
import api from "../lib/api"
import PageHeader from "../components/PageHeader"
import Spinner from "../components/Spinner"
import EmptyState from "../components/EmptyState"
import StatusBadge from "../components/StatusBadge"
import Pagination from "../components/Pagination"
import { formatDate, formatNaira } from "../lib/format"

const STATUSES = ["open", "under_review", "resolved", "closed"]
const RESOLUTIONS = ["refund_issued", "no_action", "warning_given", "account_suspended"]

function ResolveModal({ dispute, onClose, onSaved }) {
  const [resolution, setResolution] = useState("no_action")
  const [note, setNote] = useState("")
  const [refund, setRefund] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const { data } = await api.patch(`/admin/disputes/${dispute._id}/resolve`, {
        resolution,
        resolution_note: note,
        refund_amount: resolution === "refund_issued" ? Number(refund || 0) : 0,
      })
      onSaved(data.data)
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't resolve this dispute.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-lg border border-hairline bg-panel">
        <div className="flex items-center justify-between border-b border-hairline px-5 py-3.5">
          <h3 className="text-sm font-semibold text-ink">Resolve dispute</h3>
          <button onClick={onClose} className="text-faint hover:text-ink">
            <X size={16} />
          </button>
        </div>
        <div className="space-y-4 px-5 py-4">
          <p className="rounded-md bg-panel-raised p-3 text-xs text-muted leading-relaxed">
            {dispute.description}
          </p>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">Resolution</label>
            <select
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              className="w-full rounded-md border border-hairline bg-panel-raised px-3 py-2 text-sm text-ink focus:border-amber focus:outline-none"
            >
              {RESOLUTIONS.map((r) => (
                <option key={r} value={r}>
                  {r.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </div>
          {resolution === "refund_issued" && (
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">
                Refund amount (₦)
              </label>
              <input
                type="number"
                min="0"
                value={refund}
                onChange={(e) => setRefund(e.target.value)}
                placeholder={dispute.order_id?.price || "0"}
                className="w-full rounded-md border border-hairline bg-panel-raised px-3 py-2 text-sm text-ink font-mono focus:border-amber focus:outline-none"
              />
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">
              Note to the person who raised it
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-hairline bg-panel-raised px-3 py-2 text-sm text-ink focus:border-amber focus:outline-none resize-none"
            />
          </div>
          {error && (
            <div className="rounded-md border border-bad/30 bg-bad-dim px-3 py-2 text-xs text-bad">{error}</div>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-hairline px-5 py-3.5">
          <button
            onClick={onClose}
            className="rounded-md border border-hairline px-3.5 py-1.5 text-sm font-medium text-muted hover:text-ink"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-amber px-3.5 py-1.5 text-sm font-semibold text-[#181008] hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Resolving…" : "Resolve dispute"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Disputes() {
  const [disputes, setDisputes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [status, setStatus] = useState("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [resolving, setResolving] = useState(null)

  const load = () => {
    setLoading(true)
    api
      .get("/admin/disputes", { params: { page, limit: 15, ...(status !== "all" && { status }) } })
      .then((res) => {
        setDisputes(res.data.data || [])
        setTotalPages(res.data.totalPages || 1)
      })
      .catch((err) => setError(err.response?.data?.message || "Couldn't load disputes."))
      .finally(() => setLoading(false))
  }

  useEffect(load, [status, page])

  const handleStatusChange = (s) => {
    setStatus(s)
    setPage(1)
  }

  const setDisputeStatus = async (id, newStatus) => {
    try {
      await api.patch(`/admin/disputes/${id}/status`, { status: newStatus })
      setDisputes((prev) => prev.map((d) => (d._id === id ? { ...d, status: newStatus } : d)))
    } catch (err) {
      alert(err.response?.data?.message || "Couldn't update status.")
    }
  }

  const handleResolved = (updated) => {
    setDisputes((prev) => prev.map((d) => (d._id === updated._id ? { ...d, ...updated } : d)))
    setResolving(null)
  }

  return (
    <div>
      <PageHeader title="Disputes" sub="Raised by customers or runners on completed/cancelled orders" />

      <div className="mb-4 flex flex-wrap gap-1 rounded-md border border-hairline bg-panel p-1 w-fit">
        {["all", ...STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => handleStatusChange(s)}
            className={`rounded px-3 py-1 text-xs font-medium capitalize transition-colors ${
              status === s ? "bg-amber-dim text-amber" : "text-muted hover:text-ink"
            }`}
          >
            {s.replaceAll("_", " ")}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner label="Loading disputes…" />
      ) : error ? (
        <div className="rounded-md border border-bad/30 bg-bad-dim p-4 text-sm text-bad">{error}</div>
      ) : disputes.length === 0 ? (
        <div className="rounded-lg border border-hairline bg-panel">
          <EmptyState icon={ShieldAlert} title="No disputes in this state" />
        </div>
      ) : (
        <div className="space-y-3">
          {disputes.map((d) => (
            <div key={d._id} className="rounded-lg border border-hairline bg-panel p-4">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-ink capitalize">
                      {d.reason.replaceAll("_", " ")}
                    </span>
                    <StatusBadge status={d.status} />
                  </div>
                  <div className="mt-1 text-xs text-faint">
                    {d.raised_by?.name} vs. {d.against?.name} · order {formatNaira(d.order_id?.price)} · {formatDate(d.createdAt)}
                  </div>
                </div>
                {d.status !== "resolved" && (
                  <div className="flex shrink-0 gap-2">
                    {d.status === "open" && (
                      <button
                        onClick={() => setDisputeStatus(d._id, "under_review")}
                        className="rounded-md border border-hairline px-2.5 py-1 text-xs font-medium text-muted hover:text-ink"
                      >
                        Start review
                      </button>
                    )}
                    <button
                      onClick={() => setResolving(d)}
                      className="rounded-md bg-amber-dim border border-amber/30 px-2.5 py-1 text-xs font-semibold text-amber hover:bg-amber/20"
                    >
                      Resolve
                    </button>
                  </div>
                )}
              </div>
              <p className="text-sm text-muted leading-relaxed">{d.description}</p>
              {d.status === "resolved" && (
                <div className="mt-2 rounded-md bg-panel-raised p-2.5 text-xs text-muted">
                  <span className="font-medium text-ink capitalize">{d.resolution?.replaceAll("_", " ")}</span>
                  {d.resolution_note && ` — ${d.resolution_note}`}
                  {d.refund_issued && <span className="ml-1 text-good">(₦{d.refund_amount} refunded)</span>}
                </div>
              )}
            </div>
          ))}
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      )}

      {resolving && <ResolveModal dispute={resolving} onClose={() => setResolving(null)} onSaved={handleResolved} />}
    </div>
  )
}
