import { useEffect, useState } from "react"
import api from "../lib/api"
import DetailModal, { DetailRow, DetailSection } from "./DetailModal"
import Spinner from "./Spinner"
import StatusBadge from "./StatusBadge"
import { formatDate, formatNaira, shortId, initials } from "../lib/format"

// Full application view for a runner — opened by clicking a card in the
// Runners page. Works the same whether the runner is pending, approved, or
// rejected: admins need to see ID documents and bank details BEFORE
// deciding whether to approve someone, not just after.
export default function RunnerDetailModal({ runner, onClose }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api
      .get(`/admin/orders?runner_id=${runner._id}`)
      .then((res) => {
        if (!cancelled) setOrders((res.data.data || []).slice(0, 5))
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [runner._id])

  const { documents } = runner

  return (
    <DetailModal
      title={runner.user_id?.name || "Unknown runner"}
      subtitle={`#${shortId(runner._id)} · applied ${formatDate(runner.createdAt)}`}
      onClose={onClose}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-panel-raised font-mono text-sm font-semibold text-muted">
            {initials(runner.user_id?.name)}
          </div>
          <div>
            <div className="text-sm font-medium text-ink">{runner.user_id?.name || "Unknown"}</div>
            <div className="text-xs text-faint">{runner.user_id?.phone}</div>
          </div>
        </div>
        <StatusBadge status={runner.status} />
      </div>

      <DetailSection title="Contact">
        <DetailRow label="Email" value={runner.user_id?.email} />
        <DetailRow label="Phone" value={runner.user_id?.phone} />
        <DetailRow
          label="Address"
          value={[runner.address?.street, runner.address?.city, runner.address?.state, runner.address?.country]
            .filter(Boolean)
            .join(", ") || "—"}
        />
      </DetailSection>

      <DetailSection title="Identity documents">
        <DetailRow label="ID type" value={documents?.id_type ? documents.id_type.replaceAll("_", " ") : "Not submitted"} />
        <DetailRow label="ID number" value={documents?.id_number} />
        <DetailRow label="Verified" value={documents?.verified ? "Yes" : "No"} />
        {documents?.rejection_note && (
          <p className="mt-1.5 text-xs text-bad">Rejection note: {documents.rejection_note}</p>
        )}
        {(documents?.id_image?.url || documents?.selfie?.url) && (
          <div className="mt-2 grid grid-cols-2 gap-2">
            {documents?.id_image?.url && (
              <a href={documents.id_image.url} target="_blank" rel="noreferrer" className="block">
                <img src={documents.id_image.url} alt="ID document" className="h-24 w-full rounded-md border border-hairline object-cover" />
                <span className="mt-1 block text-center text-[10px] text-faint">ID document</span>
              </a>
            )}
            {documents?.selfie?.url && (
              <a href={documents.selfie.url} target="_blank" rel="noreferrer" className="block">
                <img src={documents.selfie.url} alt="Selfie" className="h-24 w-full rounded-md border border-hairline object-cover" />
                <span className="mt-1 block text-center text-[10px] text-faint">Selfie</span>
              </a>
            )}
          </div>
        )}
      </DetailSection>

      <DetailSection title="Bank details">
        <DetailRow label="Bank" value={runner.bank_details?.bank_name} />
        <DetailRow label="Account name" value={runner.bank_details?.account_name} />
        <DetailRow label="Account number" value={runner.bank_details?.account_number} />
      </DetailSection>

      <DetailSection title="Performance">
        <DetailRow label="Rating" value={`${runner.rating?.toFixed(1) ?? "—"} (${runner.totalRatings || 0} ratings)`} />
        <DetailRow label="Completed jobs" value={runner.completedJobs || 0} />
        <DetailRow label="Total earnings" value={formatNaira(runner.totalEarnings)} />
        <DetailRow label="Currently available" value={runner.isAvailable ? "Yes" : "No"} />
      </DetailSection>

      {loading ? (
        <Spinner label="Loading order history…" />
      ) : (
        <DetailSection title={`Recent orders (${orders.length})`}>
          {orders.length === 0 ? (
            <p className="text-xs text-faint">No orders yet.</p>
          ) : (
            <div className="space-y-2">
              {orders.map((o) => (
                <div key={o._id} className="flex items-center justify-between text-xs">
                  <span className="text-muted">{o.title || o.description?.slice(0, 24) || shortId(o._id)}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-ink">{formatNaira(o.runnerPayout)}</span>
                    <StatusBadge status={o.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </DetailSection>
      )}
    </DetailModal>
  )
}