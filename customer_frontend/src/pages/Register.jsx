import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Radio, ArrowRight } from "lucide-react"
import { useAuth } from "../context/AuthContext"

export default function Register() {
  const { register, loading, error } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" })

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const result = await register(form)
    if (result) navigate("/verify-otp", { state: { email: result.email } })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-base px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-dim text-amber">
            <Radio size={22} strokeWidth={2.5} />
          </div>
          <h1 className="font-display text-xl font-bold text-ink">Create your account</h1>
          <p className="mt-1 text-sm text-muted">Runners for your errands, on demand.</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-hairline bg-panel p-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">Full name</label>
            <input
              required
              value={form.name}
              onChange={update("name")}
              placeholder="Ada Obi"
              className="w-full rounded-lg border border-hairline bg-panel-raised px-3.5 py-2.5 text-sm text-ink placeholder:text-faint focus:border-amber focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={update("email")}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-hairline bg-panel-raised px-3.5 py-2.5 text-sm text-ink placeholder:text-faint focus:border-amber focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">Phone</label>
            <input
              required
              value={form.phone}
              onChange={update("phone")}
              placeholder="0803 000 0000"
              className="w-full rounded-lg border border-hairline bg-panel-raised px-3.5 py-2.5 text-sm text-ink placeholder:text-faint focus:border-amber focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={update("password")}
              placeholder="At least 6 characters"
              className="w-full rounded-lg border border-hairline bg-panel-raised px-3.5 py-2.5 text-sm text-ink placeholder:text-faint focus:border-amber focus:outline-none"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-bad/30 bg-bad-dim px-3 py-2 text-xs text-bad">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber py-3 text-sm font-semibold text-[#1a1206] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Creating account…" : "Create account"}
            {!loading && <ArrowRight size={15} />}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-faint">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-amber hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
