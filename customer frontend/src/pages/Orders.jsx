import { useEffect, useMemo, useState } from "react"
import { Package } from "lucide-react"
import api from "../lib/api"
import TopBar from "../components/TopBar"
import OrderTicket from "../components/OrderTicket"
import Spinner from "../components/Spinner"
import EmptyState from "../components/EmptyState"

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState("active")

  useEffect(() => {
    api
      .get("/orders")
      .then((res) => setOrders(res.data.data || []))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const active = ["pending", "accepted", "in_progress"]
    return orders.filter((o) => (tab === "active" ? active.includes(o.status) : !active.includes(o.status)))
  }, [orders, tab])

  return (
    <div>
      <TopBar title="Your errands" />
      <div className="px-5 py-4">
        <div className="mb-4 flex gap-1 rounded-lg border border-hairline bg-panel p-1 w-fit">
          {["active", "history"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-md px-4 py-1.5 text-xs font-medium capitalize transition-colors ${
                tab === t ? "bg-amber-dim text-amber" : "text-muted hover:text-ink"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <Spinner label="Loading errands…" />
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-hairline bg-panel">
            <EmptyState
              icon={Package}
              title={tab === "active" ? "No active errands" : "No past errands yet"}
            />
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((o) => (
              <div key={o._id}>
                <div className="ticket-edge h-2 rounded-t-xl border border-b-0 border-hairline bg-panel" />
                <OrderTicket order={o} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
