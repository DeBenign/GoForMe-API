import { useEffect, useMemo, useState } from "react"
import { UserCheck, Star, Check, X as XIcon } from "lucide-react"
import api from "../lib/api"
import PageHeader from "../components/PageHeader"
import Spinner from "../components/Spinner"
import EmptyState from "../components/EmptyState"
import StatusBadge from "../components/StatusBadge"
import { formatNaira, initials } from "../lib/format"

export default function Runners() {
  const [runners, setRunners] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState("pending")
  const [busyId, setBusyId] = useState(null)

  const load = () => {
    setLoading(true)
    api
      .get("/runners")
      .then((res) => setRunners(res.data.data || []))
      .catch((err) => setError(err.response?.data?.message || "Couldn't load runners."))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const counts = useMemo(
    () => ({
      pending: runners.filter((r) => r.status === "pending").length,
      approved: runners.filter((r) => r.status === "approved").length,
      rejected: runners.filter((r) => r.status === "rejected").length,
    }),
    [runners]
  )

  const filtered = useMemo(() => runners.filter((r) => r.status === tab), [runners, tab])

  const act = async (id, action) => {
    setBusyId(id)
    try {
      await api.patch(`/admin/runners/${id}/${action}`)
      setRunners((prev) =>
        prev.map((r) => (r._id === id ? { ...r, status: action === "approve" ? "approved" : "rejected" } : r))
      )
    } catch (err) {
      alert(err.response?.data?.message || `Couldn't ${action} this runner.`)
    } finally {
      setBusyId(null)
    }
  }

  if (loading) return <Spinner label="Loading runners…" />
  if (error) return <div className="rounded-md border border-bad/30 bg-bad-dim p-4 text-sm text-bad">{error}</div>

  return (
    <div>
      <PageHeader title="Runners" sub={`${runners.length} applications on file`} />

      <div className="mb-4 flex gap-1 rounded-md border border-hairline bg-panel p-1 w-fit">
        {["pending", "approved", "rejected"].map((s) => (
          <button
            key={s}
            onClick={() => setTab(s)}
            className={`rounded px-3 py-1 text-xs font-medium capitalize transition-colors ${
              tab === s ? "bg-amber-dim text-amber" : "text-muted hover:text-ink"
            }`}
          >
            {s} <span className="font-mono text-faint">({counts[s]})</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-hairline bg-panel">
          <EmptyState icon={UserCheck} title={`No ${tab} runners`} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r) => (
            <div key={r._id} className="rounded-lg border border-hairline bg-panel p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-panel-raised font-mono text-xs font-semibold text-muted">
                    {initials(r.user_id?.name)}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-ink">{r.user_id?.name || "Unknown"}</div>
                    <div className="text-xs text-faint">{r.user_id?.phone}</div>
                  </div>
                </div>
                <StatusBadge status={r.status} />
              </div>

              <div className="mb-3 grid grid-cols-3 gap-2 rounded-md bg-panel-raised p-2.5 text-center">
                <div>
                  <div className="flex items-center justify-center gap-1 font-mono text-sm text-ink">
                    <Star size={11} className="text-warn" fill="currentColor" />
                    {r.rating?.toFixed(1)}
                  </div>
                  <div className="text-[10px] text-faint uppercase tracking-wide">Rating</div>
                </div>
                <div>
                  <div className="font-mono text-sm text-ink">{r.completedJobs || 0}</div>
                  <div className="text-[10px] text-faint uppercase tracking-wide">Jobs</div>
                </div>
                <div>
                  <div className="font-mono text-sm text-ink">{formatNaira(r.totalEarnings)}</div>
                  <div className="text-[10px] text-faint uppercase tracking-wide">Earned</div>
                </div>
              </div>

              <div className="mb-3 space-y-1 text-xs text-muted">
                <div>
                  <span className="text-faint">ID type: </span>
                  {r.documents?.id_type ? r.documents.id_type.replaceAll("_", " ") : "Not submitted"}
                </div>
                <div>
                  <span className="text-faint">Address: </span>
                  {[r.address?.city, r.address?.state, r.address?.country].filter(Boolean).join(", ") || "—"}
                </div>
                <div>
                  <span className="text-faint">Bank: </span>
                  {r.bank_details?.bank_name || "Not linked"}
                </div>
              </div>

              {r.status === "pending" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => act(r._id, "approve")}
                    disabled={busyId === r._id}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-good-dim border border-good/30 py-1.5 text-xs font-semibold text-good hover:bg-good/20 disabled:opacity-50"
                  >
                    <Check size={13} /> Approve
                  </button>
                  <button
                    onClick={() => act(r._id, "reject")}
                    disabled={busyId === r._id}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-bad-dim border border-bad/30 py-1.5 text-xs font-semibold text-bad hover:bg-bad/20 disabled:opacity-50"
                  >
                    <XIcon size={13} /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
