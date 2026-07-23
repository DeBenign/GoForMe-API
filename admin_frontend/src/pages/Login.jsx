import { useState } from "react"
import { Navigate } from "react-router-dom"
import { ArrowRight } from "lucide-react"
import { useAuth } from "../context/AuthContext"

export default function Login() {
  const { user, login, loading, error } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  if (user) return <Navigate to="/" replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    await login(email, password)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-base px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <img src="/goforme-mark.svg" alt="GoForMe" className="mb-3 h-11 w-11" />
          <h1 className="font-display text-lg font-semibold text-ink">GoForMe Dispatch Console</h1>
          <p className="mt-1 text-sm text-muted">Admin access only</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-hairline bg-panel p-6"
        >
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@goforme.ng"
            className="mb-4 w-full rounded-md border border-hairline bg-panel-raised px-3 py-2 text-sm text-ink placeholder:text-faint focus:border-amber focus:outline-none"
          />

          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">
            Password
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="mb-5 w-full rounded-md border border-hairline bg-panel-raised px-3 py-2 text-sm text-ink placeholder:text-faint focus:border-amber focus:outline-none"
          />

          {error && (
            <div className="mb-4 rounded-md border border-bad/30 bg-bad-dim px-3 py-2 text-xs text-bad">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-amber py-2.5 text-sm font-semibold text-[#181008] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
            {!loading && <ArrowRight size={15} />}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-faint">
          Only accounts with the <span className="font-mono text-muted">admin</span> role can enter the console.
        </p>
      </div>
    </div>
  )
}