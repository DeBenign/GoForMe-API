import { useState } from "react"
import { useLocation, useNavigate, Navigate } from "react-router-dom"
import { ShieldCheck } from "lucide-react"
import { useAuth } from "../context/AuthContext"

export default function VerifyOtp() {
  const { verifyOtp, resendOtp, loading, error } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const email = location.state?.email
  const [otp, setOtp] = useState("")
  const [resent, setResent] = useState(false)

  if (!email) return <Navigate to="/register" replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    const ok = await verifyOtp(email, otp)
    if (ok) navigate("/login")
  }

  const handleResend = async () => {
    setResent(false)
    const ok = await resendOtp(email)
    if (ok) setResent(true)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-base px-5">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-dim text-amber">
            <ShieldCheck size={22} strokeWidth={2.5} />
          </div>
          <h1 className="font-display text-xl font-bold text-ink">Verify your phone</h1>
          <p className="mt-1 text-sm text-muted">
            We sent a 6-digit code by SMS to the number on <span className="text-ink">{email}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-hairline bg-panel p-6">
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">
            6-digit code
          </label>
          <input
            required
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            className="mb-5 w-full rounded-lg border border-hairline bg-panel-raised px-3.5 py-3 text-center font-mono text-lg tracking-[0.5em] text-ink placeholder:tracking-normal placeholder:text-faint focus:border-amber focus:outline-none"
          />

          {error && (
            <div className="mb-4 rounded-lg border border-bad/30 bg-bad-dim px-3 py-2 text-xs text-bad">{error}</div>
          )}
          {resent && (
            <div className="mb-4 rounded-lg border border-good/30 bg-good-dim px-3 py-2 text-xs text-good">
              A new code is on its way.
            </div>
          )}

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full rounded-lg bg-amber py-3 text-sm font-semibold text-[#1a1206] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Verifying…" : "Verify"}
          </button>
        </form>

        <button onClick={handleResend} className="mt-5 w-full text-center text-sm text-faint hover:text-muted">
          Didn't get a code? <span className="font-medium text-amber">Resend</span>
        </button>
      </div>
    </div>
  )
}
