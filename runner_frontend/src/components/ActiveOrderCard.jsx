import { MapPin, Phone, Navigation, CheckCircle2, X } from "lucide-react"
import StatusBadge from "./StatusBadge"
import { formatNaira, shortId, STATUS_COPY } from "../lib/format"

export default function ActiveOrderCard({ order, onStart, onComplete, onDecline, busy }) {
  return (
    <div className="ticket-edge rounded-b-xl border border-t-0 border-hairline bg-panel px-4 pb-4 pt-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-ink">
            {order.title || order.description || "Errand"}
          </div>
          <div className="mt-0.5 font-mono text-[11px] text-faint">#{shortId(order._id)}</div>
        </div>
        <span className="shrink-0 text-right">
          <span className="block font-mono text-sm font-semibold text-ink">
            {formatNaira(order.runnerPayout || order.price)}
          </span>
          <span className="block text-[10px] text-faint">you earn</span>
        </span>
      </div>

      <div className="mt-3 space-y-1.5 border-t border-dashed border-hairline pt-3">
        <div className="flex items-start gap-1.5 text-xs text-muted">
          <MapPin size={13} className="mt-0.5 shrink-0" />
          <span>Pickup: {order.pickup_location?.address || `${order.pickup_location?.lat}, ${order.pickup_location?.lng}`}</span>
        </div>
        {order.dropoff_location?.address && (
          <div className="flex items-start gap-1.5 text-xs text-muted">
            <Navigation size={13} className="mt-0.5 shrink-0" />
            <span>Drop-off: {order.dropoff_location.address}</span>
          </div>
        )}
        {order.user_id?.name && (
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <Phone size={13} className="shrink-0" />
            <span>{order.user_id.name}{order.user_id.phone ? ` · ${order.user_id.phone}` : ""}</span>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-dashed border-hairline pt-3">
        <StatusBadge status={order.status} label={STATUS_COPY[order.status]} />
      </div>

      {order.status === "accepted" && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={onDecline}
            disabled={busy}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-hairline px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:border-bad hover:text-bad disabled:opacity-50"
          >
            <X size={15} />
          </button>
          <button
            onClick={onStart}
            disabled={busy}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-amber py-2.5 text-sm font-semibold text-[#1a1206] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Navigation size={15} /> Start errand
          </button>
        </div>
      )}

      {order.status === "in_progress" && (
        <button
          onClick={onComplete}
          disabled={busy}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-good py-2.5 text-sm font-semibold text-[#0d1f15] transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <CheckCircle2 size={15} /> Mark complete
        </button>
      )}
    </div>
  )
}