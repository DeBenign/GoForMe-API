import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Package, Users, UserCheck, ShieldAlert, Banknote } from "lucide-react"
import api from "../lib/api"
import StatCard from "../components/StatCard"
import StatusBadge from "../components/StatusBadge"
import Spinner from "../components/Spinner"
import { formatDate, formatNaira, shortId } from "../lib/format"

export default function Overview() {
  const [state, setState] = useState({ loading: true, error: null })
  const [orders, setOrders] = useState([])
  const [users, setUsers] = useState([])
  const [runners, setRunners] = useState([])
  const [disputes, setDisputes] = useState([])
  const [payouts, setPayouts] = useState([])
  const [platformRating, setPlatformRating] = useState({ average: 0, count: 0 })

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [ordersRes, usersRes, runnersRes, disputesRes, payoutsRes, platformRatingRes] = await Promise.all([
          api.get("/admin/orders"),
          api.get("/admin/users"),
          api.get("/runners"),
          api.get("/admin/disputes", { params: { limit: 5 } }),
          api.get("/admin/payouts", { params: { limit: 5 } }),
          api.get("/ratings/platform"),
        ])
        if (cancelled) return
        setOrders(ordersRes.data.data || [])
        setUsers(usersRes.data.data || [])
        setRunners(runnersRes.data.data || [])
        setDisputes(disputesRes.data.data || [])
        setPayouts(payoutsRes.data.data || [])
        setPlatformRating({ average: platformRatingRes.data.average || 0, count: platformRatingRes.data.count || 0 })
        setState({ loading: false, error: null })
      } catch (err) {
        if (!cancelled)
          setState({ loading: false, error: err.response?.data?.message || "Couldn't load the board." })
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const stats = useMemo(() => {
    const activeOrders = orders.filter((o) => ["pending", "accepted", "in_progress"].includes(o.status))
    const pendingRunners = runners.filter((r) => r.status === "pending")
    const openDisputes = disputes.filter((d) => d.status === "open" || d.status === "under_review")
    const gmv = orders
      .filter((o) => o.status === "completed")
      .reduce((sum, o) => sum + (o.price || 0), 0)
    const platformRevenue = orders
      .filter((o) => o.status === "completed")
      .reduce((sum, o) => sum + (o.commissionAmount || 0), 0)
    return {
      activeOrders: activeOrders.length,
      totalOrders: orders.length,
      totalUsers: users.length,
      pendingRunners: pendingRunners.length,
      approvedRunners: runners.filter((r) => r.status === "approved").length,
      openDisputes: openDisputes.length,
      gmv,
      platformRevenue,
    }
  }, [orders, users, runners, disputes])

  const recentActivity = useMemo(() => {
    return [...orders]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 12)
  }, [orders])

  if (state.loading) return <Spinner label="Pulling the board…" />
  if (state.error)
    return <div className="rounded-md border border-bad/30 bg-bad-dim p-4 text-sm text-bad">{state.error}</div>

  return (
    <div>
      {/* Signature element — a live dispatch ticker of the most recent order events */}
      <div className="mb-6 overflow-hidden rounded-lg border border-hairline bg-panel">
        <div className="flex items-center gap-2 border-b border-hairline px-4 py-2">
          <span className="h-1.5 w-1.5 rounded-full bg-good animate-pulse-dot" />
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted">
            Live board
          </span>
        </div>
        <div className="relative h-9 overflow-hidden">
          {recentActivity.length === 0 ? (
            <div className="flex h-full items-center px-4 text-xs text-faint">No orders yet.</div>
          ) : (
            <div className="animate-ticker flex w-max items-center gap-8 whitespace-nowrap px-4 py-2">
              {[...recentActivity, ...recentActivity].map((o, i) => (
                <span key={i} className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-faint">#{shortId(o._id)}</span>
                  <span className="text-muted">{o.category}</span>
                  <StatusBadge status={o.status} />
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Active errands" value={stats.activeOrders} sub={`${stats.totalOrders} total`} accent />
        <StatCard label="Completed GMV" value={formatNaira(stats.gmv)} sub="all-time" />
        <StatCard label="Platform revenue" value={formatNaira(stats.platformRevenue)} sub="commission, all-time" accent />
        <StatCard
          label="Platform rating"
          value={platformRating.count ? `${platformRating.average.toFixed(1)} ★` : "—"}
          sub={`${platformRating.count} customer ratings`}
        />
        <StatCard label="Runners" value={stats.approvedRunners} sub={`${stats.pendingRunners} awaiting review`} />
        <StatCard label="Open disputes" value={stats.openDisputes} sub={`${disputes.length} recent`} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-hairline bg-panel">
          <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
            <h3 className="text-sm font-semibold text-ink">Needs attention</h3>
          </div>
          <div className="divide-y divide-hairline">
            {stats.pendingRunners > 0 && (
              <Link to="/runners" className="flex items-center justify-between px-4 py-3 hover:bg-panel-raised">
                <span className="flex items-center gap-2 text-sm text-ink">
                  <UserCheck size={15} className="text-warn" />
                  {stats.pendingRunners} runner application{stats.pendingRunners !== 1 ? "s" : ""} pending
                </span>
                <span className="text-xs text-faint">Review →</span>
              </Link>
            )}
            {stats.openDisputes > 0 && (
              <Link to="/disputes" className="flex items-center justify-between px-4 py-3 hover:bg-panel-raised">
                <span className="flex items-center gap-2 text-sm text-ink">
                  <ShieldAlert size={15} className="text-bad" />
                  {stats.openDisputes} dispute{stats.openDisputes !== 1 ? "s" : ""} unresolved
                </span>
                <span className="text-xs text-faint">Review →</span>
              </Link>
            )}
            {payouts.some((p) => p.status === "pending" || p.status === "processing") && (
              <Link to="/payouts" className="flex items-center justify-between px-4 py-3 hover:bg-panel-raised">
                <span className="flex items-center gap-2 text-sm text-ink">
                  <Banknote size={15} className="text-info" />
                  Payouts in flight
                </span>
                <span className="text-xs text-faint">Review →</span>
              </Link>
            )}
            {stats.pendingRunners === 0 && stats.openDisputes === 0 && (
              <div className="px-4 py-6 text-center text-sm text-faint">All clear — nothing waiting.</div>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-hairline bg-panel">
          <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
            <h3 className="text-sm font-semibold text-ink">Latest orders</h3>
            <Link to="/orders" className="text-xs text-amber hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-hairline">
            {recentActivity.slice(0, 6).map((o) => (
              <div key={o._id} className="flex items-center justify-between px-4 py-2.5">
                <div className="min-w-0">
                  <div className="truncate text-sm text-ink">{o.title || o.category}</div>
                  <div className="text-xs text-faint">{o.user_id?.name || "—"} · {formatDate(o.createdAt)}</div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono text-xs text-muted">{formatNaira(o.price)}</span>
                  <StatusBadge status={o.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}