import { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import { ShieldAlert } from "lucide-react"
import api from "../lib/api"
import TopBar from "../components/TopBar"
import Spinner from "../components/Spinner"
import EmptyState from "../components/EmptyState"
import StatusBadge from "../components/StatusBadge"
import { formatDate, shortId } from "../lib/format"

export default function Disputes() {
  const location = useLocation()
  const [disputes, setDisputes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get("/disputes")
      .then((res) => setDisputes(res.data.data || []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <TopBar title="Reports" />
      <div className="px-5 py-5">
        {location.state?.justFiled && (
          <div className="mb-4 rounded-lg border border-good/30 bg-good-dim px-3 py-2 text-xs text-good">
            Report filed — an admin will review it shortly.
          </div>
        )}

        {loading ? (
          <Spinner label="Loading reports…" />
        ) : disputes.length === 0 ? (
          <div className="rounded-2xl border border-hairline bg-panel">
            <EmptyState
              icon={ShieldAlert}
              title="No reports filed"
              sub="If something goes wrong with an errand, you can report it from the errand's page."
            />
          </div>
        ) : (
          <div className="space-y-3">
            {disputes.map((d) => (
              <div key={d._id} className="rounded-2xl border border-hairline bg-panel p-4">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-sm font-medium capitalize text-ink">
                    {d.reason.replaceAll("_", " ")}
                  </span>
                  <StatusBadge status={d.status} />
                </div>
                <p className="text-sm text-muted">{d.description}</p>
                <div className="mt-2 text-xs text-faint">
                  Errand #{shortId(d.order_id?._id || d.order_id)} · {formatDate(d.createdAt)}
                </div>
                {d.status === "resolved" && (
                  <div className="mt-2 rounded-lg bg-panel-raised p-2.5 text-xs text-muted">
                    <span className="font-medium text-ink capitalize">{d.resolution?.replaceAll("_", " ")}</span>
                    {d.resolution_note && ` — ${d.resolution_note}`}
                    {d.refund_issued && <span className="ml-1 text-good">(refunded)</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
