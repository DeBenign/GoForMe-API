import { useState } from "react"
import api from "../lib/api"
import TopBar from "../components/TopBar"
import ReferralCard from "../components/ReferralCard"
import { useAuth } from "../context/AuthContext"
import { initials } from "../lib/format"
import { LogOut, Check } from "lucide-react"

export default function Profile() {
  const { user, logout } = useAuth()
  const [name, setName] = useState(user?.name || "")
  const [phone, setPhone] = useState(user?.phone || "")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const { data } = await api.patch(`/users/${user._id}`, { name, phone })
      localStorage.setItem("gfm_user", JSON.stringify(data.data))
      setSaved(true)
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't save your changes.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <TopBar title="Profile" />
      <div className="px-5 py-5">
        <div className="flex flex-col items-center py-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-panel-raised font-mono text-lg font-semibold text-muted">
            {initials(user?.name)}
          </div>
          <div className="mt-2 text-sm text-faint">{user?.email}</div>
        </div>

        <form onSubmit={handleSave} className="rounded-2xl border border-hairline bg-panel p-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">Full name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-hairline bg-panel-raised px-3.5 py-2.5 text-sm text-ink focus:border-amber focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">Phone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-hairline bg-panel-raised px-3.5 py-2.5 text-sm text-ink focus:border-amber focus:outline-none"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-bad/30 bg-bad-dim px-3 py-2 text-xs text-bad">{error}</div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber py-2.5 text-sm font-semibold text-[#1a1206] hover:opacity-90 disabled:opacity-50"
          >
            {saved ? <Check size={15} /> : null}
            {saving ? "Saving…" : saved ? "Saved" : "Save changes"}
          </button>
        </form>

        <ReferralCard />

        <button
          onClick={logout}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-hairline py-2.5 text-sm font-medium text-bad hover:bg-bad-dim"
        >
          <LogOut size={15} /> Log out
        </button>
      </div>
    </div>
  )
}