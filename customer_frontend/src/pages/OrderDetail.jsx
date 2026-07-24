import { useEffect, useMemo, useRef, useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { ArrowLeft, Send, MapPin, ShieldAlert, X } from "lucide-react"
import api from "../lib/api"
import { getSocket } from "../lib/socket"
import Spinner from "../components/Spinner"
import StatusBadge from "../components/StatusBadge"
import { formatNaira, formatTime, shortId, STATUS_COPY, initials } from "../lib/format"

const STEPS = ["pending", "accepted", "in_progress", "completed"]

function CancelModal({ order, onClose, onCancelled }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const handleCancel = async () => {
    setSaving(true)
    setError(null)
    try {
      const { data } = await api.patch(`/orders/${order._id}/cancel`)
      onCancelled(data)
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't cancel this errand.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-hairline bg-panel p-5">
        <h3 className="text-sm font-semibold text-ink">Cancel this errand?</h3>
        <p className="mt-1.5 text-sm text-muted">
          {formatNaira(order.price)} will be refunded to your wallet right away.
        </p>
        {error && (
          <div className="mt-3 rounded-lg border border-bad/30 bg-bad-dim px-3 py-2 text-xs text-bad">{error}</div>
        )}
        <div className="mt-4 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-hairline py-2.5 text-sm font-medium text-muted hover:text-ink"
          >
            Keep it
          </button>
          <button
            onClick={handleCancel}
            disabled={saving}
            className="flex-1 rounded-lg bg-bad-dim border border-bad/30 py-2.5 text-sm font-semibold text-bad hover:bg-bad/20 disabled:opacity-50"
          >
            {saving ? "Cancelling…" : "Yes, cancel"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [runner, setRunner] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCancel, setShowCancel] = useState(false)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState("")
  const [liveLocation, setLiveLocation] = useState(null)
  const scrollRef = useRef(null)
  const socketRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const { data } = await api.get(`/orders/${id}`)
        if (cancelled) return
        setOrder(data.data)

        if (data.data.runner_id?._id) {
          const runnerRes = await api.get(`/runners/${data.data.runner_id._id}`)
          if (!cancelled) setRunner(runnerRes.data.data)
        }

        if (["accepted", "in_progress", "completed"].includes(data.data.status)) {
          const chatRes = await api.get(`/chat/${id}`)
          if (!cancelled) setMessages(chatRes.data.data || [])
        }
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || "Couldn't load this errand.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [id])

  useEffect(() => {
    const socket = getSocket()
    socketRef.current = socket
    socket.connect()
    socket.emit("order:join", { orderId: id })

    socket.on("chat:receive", (msg) => {
      setMessages((prev) => [...prev, msg])
    })
    socket.on("order:locationUpdate", (loc) => setLiveLocation(loc))
    socket.on("order:update", (updated) => setOrder((prev) => ({ ...prev, ...updated })))
    socket.on("orderStarted", () => setOrder((prev) => (prev ? { ...prev, status: "in_progress" } : prev)))
    socket.on("orderCompleted", () => setOrder((prev) => (prev ? { ...prev, status: "completed" } : prev)))

    return () => {
      socket.off("chat:receive")
      socket.off("order:locationUpdate")
      socket.off("order:update")
      socket.off("orderStarted")
      socket.off("orderCompleted")
    }
  }, [id])

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length])

  const stepIndex = useMemo(() => {
    if (!order) return 0
    if (order.status === "cancelled") return -1
    return STEPS.indexOf(order.status)
  }, [order])

  const handleSend = (e) => {
    e.preventDefault()
    if (!draft.trim() || !order?.runner_id) return
    const receiverId = order.runner_id.user_id?._id || order.runner_id.user_id
    socketRef.current?.emit("chat:send", { orderId: id, content: draft.trim(), receiverId })
    setDraft("")
  }

  const handleCancelled = () => {
    setOrder((prev) => ({ ...prev, status: "cancelled" }))
    setShowCancel(false)
  }

  if (loading) return <Spinner label="Loading errand…" />
  if (error || !order)
    return <div className="p-5 text-sm text-bad">{error || "Errand not found."}</div>

  const canCancel = ["pending", "accepted"].includes(order.status)
  const canDispute = ["completed", "cancelled"].includes(order.status)
  const canChat = ["accepted", "in_progress"].includes(order.status) && order.runner_id

  return (
    <div>
      <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-hairline bg-base/90 px-5 py-3.5 backdrop-blur">
        <button onClick={() => navigate(-1)} className="text-faint hover:text-ink">
          <ArrowLeft size={18} />
        </button>
        <div>
          <div className="font-display text-sm font-semibold text-ink">
            {order.title || `Errand #${shortId(order._id)}`}
          </div>
          <div className="text-xs text-faint">{formatNaira(order.price)}</div>
        </div>
      </div>

      <div className="px-5 py-5 space-y-5">
        {/* Status timeline */}
        <div className="rounded-2xl border border-hairline bg-panel p-4">
          <div className="mb-3 flex items-center justify-between">
            <StatusBadge status={order.status} label={STATUS_COPY[order.status]} />
            {order.runner_id && <span className="text-xs text-faint">Runner on the way</span>}
          </div>

          {order.status === "cancelled" ? (
            <p className="text-sm text-muted">This errand was cancelled and refunded to your wallet.</p>
          ) : (
            <div className="flex items-center">
              {STEPS.map((s, i) => (
                <div key={s} className="flex flex-1 items-center last:flex-none">
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${
                      i <= stepIndex ? "bg-amber" : "bg-hairline"
                    } ${i === stepIndex ? "animate-pulse-dot" : ""}`}
                  />
                  {i < STEPS.length - 1 && (
                    <div className={`h-0.5 flex-1 ${i < stepIndex ? "bg-amber" : "bg-hairline"}`} />
                  )}
                </div>
              ))}
            </div>
          )}

          {liveLocation && ["accepted", "in_progress"].includes(order.status) && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-panel-raised px-3 py-2 text-xs text-muted">
              <MapPin size={13} className="text-amber" />
              Runner's location updated {formatTime(liveLocation.updatedAt)}
            </div>
          )}
        </div>

        {/* Errand details */}
        <div className="rounded-2xl border border-hairline bg-panel p-4">
          <div className="mb-1 text-xs uppercase tracking-wide text-faint">What you asked for</div>
          <p className="text-sm text-ink">{order.description || "—"}</p>
          <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-muted border-t border-hairline pt-3">
            <div>
              <span className="text-faint">Pickup: </span>
              {order.pickup_location?.address || `${order.pickup_location?.lat}, ${order.pickup_location?.lng}`}
            </div>
            {order.dropoff_location?.address && (
              <div>
                <span className="text-faint">Drop-off: </span>
                {order.dropoff_location.address}
              </div>
            )}
          </div>
        </div>

        {/* Runner card */}
        {runner && (
          <div className="flex items-center gap-3 rounded-2xl border border-hairline bg-panel p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-panel-raised font-mono text-xs font-semibold text-muted">
              {initials(runner.user_id?.name)}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-ink">{runner.user_id?.name}</div>
              <div className="text-xs text-faint">★ {runner.rating?.toFixed(1)} · {runner.completedJobs} errands run</div>
            </div>
          </div>
        )}

        {/* Chat */}
        {canChat && (
          <div className="rounded-2xl border border-hairline bg-panel">
            <div className="border-b border-hairline px-4 py-3 text-sm font-semibold text-ink">
              Chat with your runner
            </div>
            <div className="max-h-72 space-y-2 overflow-y-auto px-4 py-3">
              {messages.length === 0 ? (
                <p className="py-4 text-center text-xs text-faint">Say hello — your runner can see this.</p>
              ) : (
                messages.map((m, i) => {
                  const mine = (m.sender_id?._id || m.sender_id) !== (runner.user_id?._id || runner.user_id)
                  return (
                    <div key={m._id || i} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${
                          mine ? "bg-amber-dim text-ink" : "bg-panel-raised text-ink"
                        }`}
                      >
                        {m.content}
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={scrollRef} />
            </div>
            <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-hairline px-3 py-2.5">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type a message…"
                className="flex-1 rounded-lg border border-hairline bg-panel-raised px-3 py-2 text-sm text-ink placeholder:text-faint focus:border-amber focus:outline-none"
              />
              <button
                type="submit"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber text-[#1a1206] hover:opacity-90"
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        )}

        <div className="flex gap-2">
          {canCancel && (
            <button
              onClick={() => setShowCancel(true)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-bad/30 bg-bad-dim py-2.5 text-sm font-medium text-bad hover:bg-bad/20"
            >
              <X size={14} /> Cancel errand
            </button>
          )}
          {canDispute && (
            <Link
              to={`/disputes/new?orderId=${order._id}`}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-hairline py-2.5 text-sm font-medium text-muted hover:text-ink"
            >
              <ShieldAlert size={14} /> Report a problem
            </Link>
          )}
        </div>
      </div>

      {showCancel && (
        <CancelModal order={order} onClose={() => setShowCancel(false)} onCancelled={handleCancelled} />
      )}
    </div>
  )
}