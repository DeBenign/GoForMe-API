import { Link } from "react-router-dom"
import StatusBadge from "./StatusBadge"
import { formatDate, formatNaira, shortId, STATUS_COPY } from "../lib/format"

// The signature visual — an errand rendered like the paper slip you'd
// hand a house help or okada rider: perforated top edge, dashed divider,
// monospace amount where the total would be scrawled.
export default function OrderTicket({ order }) {
  return (
    <Link
      to={`/orders/${order._id}`}
      className="ticket-edge block rounded-b-xl border border-t-0 border-hairline bg-panel px-4 pb-4 pt-3 transition-colors hover:bg-panel-raised"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-ink">
            {order.title || order.description || "Errand"}
          </div>
          <div className="mt-0.5 font-mono text-[11px] text-faint">
            #{shortId(order._id)} · {formatDate(order.createdAt)}
          </div>
        </div>
        <span className="shrink-0 font-mono text-sm font-semibold text-ink">
          {formatNaira(order.price)}
        </span>
      </div>
      <div className="mt-2.5 flex items-center justify-between border-t border-dashed border-hairline pt-2.5">
        <StatusBadge status={order.status} label={STATUS_COPY[order.status]} />
        <span className="text-xs text-faint">
          {order.runner_id ? "Runner assigned" : "Awaiting runner"}
        </span>
      </div>
    </Link>
  )
}
