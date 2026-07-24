import { useState, useEffect, useCallback } from "react"
import { Wallet as WalletIcon, Star, CheckCircle2, PackageSearch, LogOut } from "lucide-react"
import api from "../lib/api"
import { getSocket } from "../lib/socket"
import { formatNaira } from "../lib/format"
import { useAuth } from "../context/AuthContext"
import { useRunnerProfile } from "../context/RunnerProfileContext"
import TopBar from "../components/TopBar"
import AvailabilityToggle from "../components/AvailabilityToggle"
import ActiveOrderCard from "../components/ActiveOrderCard"
import ChatPanel from "../components/ChatPanel"
import EmptyState from "../components/EmptyState"
import Spinner from "../components/Spinner"

export default function Dashboard() {
  const { logout } = useAuth()
  const { runner, refresh: refreshProfile } = useRunnerProfile()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [banner, setBanner] = useState(null)

  const loadOrders = useCallback(async () => {
    try {
      const { data } = await api.get("/orders/runner/mine")
      setOrders(data.data)
    } catch {
      // leave existing list as-is on a failed refresh
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  // Live updates: a new errand gets auto-matched and pushed to this runner's
  // personal room the moment it happens — no polling needed.
  useEffect(() => {
    const socket = getSocket()
    socket.connect()

    const onNewOrder = ({ order }) => {
      setOrders((prev) => [order, ...prev])
      setBanner("New errand assigned to you.")
      setTimeout(() => setBanner(null), 4000)
    }

    socket.on("newOrder", onNewOrder)
    return () => {
      socket.off("newOrder", onNewOrder)
    }
  }, [])

  const activeOrder = orders.find((o) => o.status === "accepted" || o.status === "in_progress")

  const handleStart = async () => {
    if (!activeOrder) return
    setBusy(true)
    try {
      await api.patch(`/orders/${activeOrder._id}/start`)
      await loadOrders()
    } finally {
      setBusy(false)
    }
  }

  const handleComplete = async () => {
    if (!activeOrder) return
    setBusy(true)
    try {
      await api.patch(`/orders/${activeOrder._id}/complete`)
      await Promise.all([loadOrders(), refreshProfile()])
    } finally {
      setBusy(false)
    }
  }

  const handleDecline = async () => {
    if (!activeOrder) return
    setBusy(true)
    try {
      await api.patch(`/orders/${activeOrder._id}/decline`)
      await loadOrders()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-base">
      <TopBar
        right={
          <div className="flex items-center gap-2">
            <AvailabilityToggle
              isAvailable={runner?.isAvailable}
              onChange={() => refreshProfile()}
              disabled={!!activeOrder}
            />
            <button
              onClick={logout}
              aria-label="Sign out"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-hairline text-muted transition-colors hover:border-bad/40 hover:text-bad"
            >
              <LogOut size={14} />
            </button>
          </div>
        }
      />

      {banner && (
        <div className="mx-5 mt-3 rounded-lg border border-amber/30 bg-amber-dim px-3 py-2 text-xs text-amber">
          {banner}
        </div>
      )}

      <div className="mx-auto max-w-md px-5 py-4">
        {/* Stats strip */}
        <div className="mb-5 grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-hairline bg-panel px-3 py-3 text-center">
            <WalletIcon size={14} className="mx-auto mb-1 text-good" />
            <div className="font-mono text-sm font-semibold text-ink">
              {formatNaira(runner?.totalEarnings)}
            </div>
            <div className="text-[10px] uppercase tracking-wide text-faint">Earned</div>
          </div>
          <div className="rounded-xl border border-hairline bg-panel px-3 py-3 text-center">
            <Star size={14} className="mx-auto mb-1 text-amber" />
            <div className="font-mono text-sm font-semibold text-ink">
              {runner?.rating?.toFixed?.(1) ?? "—"}
            </div>
            <div className="text-[10px] uppercase tracking-wide text-faint">Rating</div>
          </div>
          <div className="rounded-xl border border-hairline bg-panel px-3 py-3 text-center">
            <CheckCircle2 size={14} className="mx-auto mb-1 text-info" />
            <div className="font-mono text-sm font-semibold text-ink">
              {runner?.completedJobs ?? 0}
            </div>
            <div className="text-[10px] uppercase tracking-wide text-faint">Completed</div>
          </div>
        </div>

        {/* Active errand */}
        {loading ? (
          <Spinner label="Checking for assigned errands…" />
        ) : activeOrder ? (
          <>
            <div className="rounded-t-xl border border-b-0 border-hairline bg-panel px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-amber">
              Your assigned errand
            </div>
            <ActiveOrderCard order={activeOrder} onStart={handleStart} onComplete={handleComplete} onDecline={handleDecline} busy={busy} />
            <ChatPanel order={activeOrder} />
          </>
        ) : runner?.isAvailable ? (
          <EmptyState
            icon={PackageSearch}
            title="Waiting for an errand"
            sub="You're online — the next nearby errand gets sent straight to you. No need to refresh."
          />
        ) : (
          <EmptyState
            icon={PackageSearch}
            title="You're offline"
            sub="Flip the switch at the top to start receiving errands near you."
          />
        )}
      </div>
    </div>
  )
}