import { useEffect, useRef, useState } from "react"
import { Send, MessageCircle } from "lucide-react"
import api from "../lib/api"
import { getSocket } from "../lib/socket"
import { useAuth } from "../context/AuthContext"

// Chat panel for the runner's currently assigned errand. Mirrors the
// customer app's chat behaviour: REST history load + Socket.IO room for
// live back-and-forth (both sides join `order_<id>` and get every
// message the instant it's sent — no polling, no page refresh).
export default function ChatPanel({ order }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState("")
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef(null)
  const socketRef = useRef(null)

  const orderId = order?._id
  const canChat = order && ["accepted", "in_progress"].includes(order.status)

  useEffect(() => {
    if (!canChat || !orderId) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    api
      .get(`/chat/${orderId}`)
      .then(({ data }) => {
        if (!cancelled) setMessages(data.data || [])
      })
      .catch(() => {
        // no history yet, or not authorized — start with an empty thread
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [orderId, canChat])

  useEffect(() => {
    if (!canChat || !orderId) return

    const socket = getSocket()
    socketRef.current = socket
    socket.connect()
    socket.emit("order:join", { orderId })

    const onReceive = (msg) => {
      if ((msg.order_id?._id || msg.order_id) !== orderId) return
      setMessages((prev) => [...prev, msg])
    }
    socket.on("chat:receive", onReceive)

    return () => {
      socket.off("chat:receive", onReceive)
    }
  }, [orderId, canChat])

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length])

  if (!canChat) return null

  const handleSend = (e) => {
    e.preventDefault()
    const content = draft.trim()
    if (!content) return
    const receiverId = order.user_id?._id || order.user_id
    socketRef.current?.emit("chat:send", { orderId, content, receiverId })
    setDraft("")
  }

  return (
    <div className="mt-3 rounded-xl border border-hairline bg-panel">
      <div className="flex items-center gap-1.5 border-b border-hairline px-4 py-3 text-sm font-semibold text-ink">
        <MessageCircle size={14} className="text-amber" />
        Chat with customer
      </div>
      <div className="max-h-64 space-y-2 overflow-y-auto px-4 py-3">
        {loading ? (
          <p className="py-4 text-center text-xs text-faint">Loading messages…</p>
        ) : messages.length === 0 ? (
          <p className="py-4 text-center text-xs text-faint">Say hello — the customer can see this.</p>
        ) : (
          messages.map((m, i) => {
            const senderId = m.sender_id?._id || m.sender_id
            const mine = senderId === user?._id
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
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber text-[#1a1206] hover:opacity-90"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  )
}