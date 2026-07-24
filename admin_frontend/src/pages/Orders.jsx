import { useEffect, useMemo, useState } from "react"
import { Package, X } from "lucide-react"
import api from "../lib/api"
import PageHeader from "../components/PageHeader"
import Spinner from "../components/Spinner"
import EmptyState from "../components/EmptyState"
import StatusBadge from "../components/StatusBadge"
import { formatDate, formatNaira, shortId } from "../lib/format"

const STATUSES = ["pending", "accepted", "in_progress", "completed", "cancelled"]

function OverrideModal({ order, onClose, onSaved }) {
  const [status, setStatus] = useState(order.status)
  const [price, setPrice] = useState(order.price)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const { data } = await api.patch(`/admin/orders/${order._id}/override`, {
        status,
        price: Number(price),
      })
      onSaved(data.data)
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't save the override.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-lg border border-hairline bg-panel">
        <div className="flex items-center justify-between border-b border-hairline px-5 py-3.5">
          <h3 className="text-sm font-semibold text-ink">
            Override order <span className="font-mono text-faint">#{shortId(order._id)}</span>
          </h3>
          <button onClick={onClose} className="text-faint hover:text-ink">
            <X size={16} />
          </button>
        </div>
        <div className="space-y-4 px-5 py-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-md border border-hairline bg-panel-raised px-3 py-2 text-sm text-ink focus:border-amber focus:outline-none"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">Price (₦)</label>
            <input
              type="number"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded-md border border-hairline bg-panel-raised px-3 py-2 text-sm text-ink font-mono focus:border-amber focus:outline-none"
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
            {saving ? "Saving…" : "Save override"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState("all")
  const [editingOrder, setEditingOrder] = useState(null)

  const load = () => {
    setLoading(true)
    api
      .get("/admin/orders")
      .then((res) => setOrders(res.data.data || []))
      .catch((err) => setError(err.response?.data?.message || "Couldn't load orders."))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const filtered = useMemo(
    () => (statusFilter === "all" ? orders : orders.filter((o) => o.status === statusFilter)),
    [orders, statusFilter]
  )

  const handleSaved = (updated) => {
    setOrders((prev) => prev.map((o) => (o._id === updated._id ? { ...o, ...updated } : o)))
    setEditingOrder(null)
  }

  if (loading) return <Spinner label="Loading orders…" />
  if (error) return <div className="rounded-md border border-bad/30 bg-bad-dim p-4 text-sm text-bad">{error}</div>

  return (
    <div>
      <PageHeader title="Orders" sub={`${orders.length} errands tracked`} />

      <div className="mb-4 flex flex-wrap gap-1 rounded-md border border-hairline bg-panel p-1 w-fit">
        {["all", ...STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded px-3 py-1 text-xs font-medium capitalize transition-colors ${
              statusFilter === s ? "bg-amber-dim text-amber" : "text-muted hover:text-ink"
            }`}
          >
            {s.replaceAll("_", " ")}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-hairline bg-panel">
        {filtered.length === 0 ? (
          <EmptyState icon={Package} title="No orders in this state" />
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-hairline text-xs uppercase tracking-wide text-faint">
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Runner</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Placed</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {filtered.map((o) => (
                <tr key={o._id} className="hover:bg-panel-raised">
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink">{o.title || "Untitled errand"}</div>
                    <div className="text-xs text-faint font-mono">#{shortId(o._id)} · {o.category}</div>
                  </td>
                  <td className="px-4 py-3 text-muted">{o.user_id?.name || "—"}</td>
                  <td className="px-4 py-3 text-muted">
                    {o.runner_id?.user_id?.name || (o.runner_id ? shortId(o.runner_id._id || o.runner_id) : "Unassigned")}
                  </td>
                  <td className="px-4 py-3 font-mono text-ink">{formatNaira(o.price)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-faint font-mono">{formatDate(o.createdAt)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setEditingOrder(o)}
                      className="rounded-md border border-hairline px-2.5 py-1 text-xs font-medium text-muted hover:text-ink hover:border-faint"
                    >
                      Override
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editingOrder && (
        <OverrideModal order={editingOrder} onClose={() => setEditingOrder(null)} onSaved={handleSaved} />
      )}
    </div>
  )
}