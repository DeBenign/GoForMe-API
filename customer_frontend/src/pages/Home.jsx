import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Plus, Wallet as WalletIcon, ChevronRight } from "lucide-react"
import api from "../lib/api"
import TopBar from "../components/TopBar"
import OrderTicket from "../components/OrderTicket"
import Spinner from "../components/Spinner"
import EmptyState from "../components/EmptyState"
import { useAuth } from "../context/AuthContext"
import { formatNaira } from "../lib/format"

export default function Home() {
  const { user } = useAuth()
  const [wallet, setWallet] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.get("/wallet/me"), api.get("/orders")])
      .then(([walletRes, ordersRes]) => {
        setWallet(walletRes.data.data)
        setOrders(ordersRes.data.data || [])
      })
      .finally(() => setLoading(false))
  }, [])

  const activeOrders = orders.filter((o) => ["pending", "accepted", "in_progress"].includes(o.status))
  const firstName = user?.name?.split(" ")[0]

  return (
    <div>
      <TopBar />
      <div className="px-5 pt-2 pb-6">
        <h1 className="font-display text-lg font-semibold text-ink">Hi {firstName} 👋</h1>
        <p className="mt-0.5 text-sm text-muted">What do you need someone to handle today?</p>

        {/* Wallet summary */}
        <Link
          to="/wallet"
          className="mt-5 flex items-center justify-between rounded-2xl border border-hairline bg-panel px-5 py-4 hover:bg-panel-raised"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-dim text-amber">
              <WalletIcon size={18} />
            </div>
            <div>
              <div className="text-xs text-faint uppercase tracking-wide">Wallet balance</div>
              <div className="font-mono text-lg font-semibold text-ink">
                {loading ? "…" : formatNaira(wallet?.balance)}
              </div>
            </div>
          </div>
          <ChevronRight size={18} className="text-faint" />
        </Link>

        {/* Primary CTA */}
        <Link
          to="/new-errand"
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-amber py-4 text-sm font-semibold text-[#1a1206] hover:opacity-90"
        >
          <Plus size={17} strokeWidth={2.5} />
          Send someone on an errand
        </Link>

        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Active errands</h2>
            {orders.length > 0 && (
              <Link to="/orders" className="text-xs text-amber hover:underline">
                See all
              </Link>
            )}
          </div>

          {loading ? (
            <Spinner label="Loading your errands…" />
          ) : activeOrders.length === 0 ? (
            <div className="rounded-2xl border border-hairline bg-panel">
              <EmptyState
                title="Nothing running right now"
                sub="Tap the button above to send someone on your next errand."
              />
            </div>
          ) : (
            <div className="space-y-4">
              {activeOrders.map((o) => (
                <div key={o._id}>
                  <div className="ticket-edge h-2 rounded-t-xl border border-b-0 border-hairline bg-panel" />
                  <OrderTicket order={o} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
