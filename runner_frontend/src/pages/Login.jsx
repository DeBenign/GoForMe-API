import { useState } from "react"
import { Navigate } from "react-router-dom"
import { Radio, ArrowRight } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import Alert from "../components/Alert"

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
    <div className="flex min-h-screen items-center justify-center bg-base px-5">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-dim text-amber">
            <Radio size={22} strokeWidth={2.5} />
          </div>
          <h1 className="font-display text-xl font-bold text-ink">GoForMe Runner</h1>
          <p className="mt-1 text-sm text-muted">Go online. Get sent errands.</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6">
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="input mb-4"
          />
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="input mb-5"
          />

          {error && <Alert type="error" message={error} />}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary mt-4 w-full"
          >
            {loading ? "Signing in…" : "Sign in"}
            {!loading && <ArrowRight size={15} />}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-faint">
          Don't have a GoForMe account yet? Sign up in the customer app first,
          then apply to become a runner from here.
        </p>
      </div>
    </div>
  )
}