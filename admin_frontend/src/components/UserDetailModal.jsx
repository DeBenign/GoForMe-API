import { useEffect, useState } from "react"
import api from "../lib/api"
import DetailModal, { DetailRow, DetailSection } from "./DetailModal"
import Spinner from "./Spinner"
import StatusBadge from "./StatusBadge"
import { formatDate, formatNaira, shortId, initials } from "../lib/format"

// Full profile view for a customer or admin account — opened by clicking a
// row in the Users table. Shows everything already on the user record plus
// their wallet balance and recent order history, fetched on open so the
// Users list itself doesn't have to carry that extra weight for every row.
export default function UserDetailModal({ user, onClose }) {
  const [wallet, setWallet] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.allSettled([
      api.get(`/wallet?user_id=${user._id}`),
      api.get(`/admin/orders?user_id=${user._id}`),
    ]).then(([walletRes, ordersRes]) => {
      if (cancelled) return
      if (walletRes.status === "fulfilled") {
        setWallet(walletRes.value.data.data?.[0] || null)
      }
      if (ordersRes.status === "fulfilled") {
        setOrders((ordersRes.value.data.data || []).slice(0, 5))
      }
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [user._id])

  return (
    <DetailModal
      title={user.name}
      subtitle={`#${shortId(user._id)} · joined ${formatDate(user.createdAt)}`}
      onClose={onClose}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-panel-raised font-mono text-sm font-semibold text-muted">
          {initials(user.name)}
        </div>
        <div>
          <div className="text-sm font-medium text-ink">{user.name}</div>
          <div className="text-xs capitalize text-faint">{user.role}</div>
        </div>
      </div>

      <DetailSection title="Contact">
        <DetailRow label="Email" value={user.email} />
        <DetailRow label="Phone" value={user.phone} />
        <DetailRow label="Verified" value={user.isVerified ? "Yes" : "No"} />
        <DetailRow label="Account active" value={user.isActive ? "Yes" : "No"} />
      </DetailSection>

      {user.referralCode && (
        <DetailSection title="Referral">
          <DetailRow label="Their code" value={user.referralCode} />
          <DetailRow label="Referred by" value={user.referredBy ? `#${shortId(user.referredBy)}` : "—"} />
        </DetailSection>
      )}

      {loading ? (
        <Spinner label="Loading wallet & orders…" />
      ) : (
        <>
          <DetailSection title="Wallet">
            <DetailRow label="Balance" value={wallet ? formatNaira(wallet.balance) : "No wallet"} />
            <DetailRow label="Transactions on file" value={wallet?.transactions?.length ?? 0} />
          </DetailSection>

          <DetailSection title={`Recent orders (${orders.length})`}>
            {orders.length === 0 ? (
              <p className="text-xs text-faint">No orders yet.</p>
            ) : (
              <div className="space-y-2">
                {orders.map((o) => (
                  <div key={o._id} className="flex items-center justify-between text-xs">
                    <span className="text-muted">{o.title || o.description?.slice(0, 24) || shortId(o._id)}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-ink">{formatNaira(o.price)}</span>
                      <StatusBadge status={o.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DetailSection>
        </>
      )}
    </DetailModal>
  )
}