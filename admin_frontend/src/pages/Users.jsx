import { useEffect, useMemo, useState } from "react"
import { Search, Users as UsersIcon } from "lucide-react"
import api from "../lib/api"
import PageHeader from "../components/PageHeader"
import Spinner from "../components/Spinner"
import EmptyState from "../components/EmptyState"
import { formatDate, initials } from "../lib/format"
import UserDetailModal from "../components/UserDetailModal"

const ROLE_STYLE = {
  admin: "text-amber bg-amber-dim border-amber/30",
  runner: "text-info bg-info-dim border-info/30",
  customer: "text-muted bg-panel-raised border-hairline",
}

export default function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [selectedUser, setSelectedUser] = useState(null)

  useEffect(() => {
    api
      .get("/admin/users")
      .then((res) => setUsers(res.data.data || []))
      .catch((err) => setError(err.response?.data?.message || "Couldn't load users."))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchesRole = roleFilter === "all" || u.role === roleFilter
      const q = query.trim().toLowerCase()
      const matchesQuery =
        !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.phone?.includes(q)
      return matchesRole && matchesQuery
    })
  }, [users, query, roleFilter])

  if (loading) return <Spinner label="Loading users…" />
  if (error) return <div className="rounded-md border border-bad/30 bg-bad-dim p-4 text-sm text-bad">{error}</div>

  return (
    <div>
      <PageHeader title="Users" sub={`${users.length} registered accounts`} />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, phone…"
            className="w-full rounded-md border border-hairline bg-panel py-2 pl-9 pr-3 text-sm text-ink placeholder:text-faint focus:border-amber focus:outline-none"
          />
        </div>
        <div className="flex gap-1 rounded-md border border-hairline bg-panel p-1">
          {["all", "customer", "runner", "admin"].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`rounded px-3 py-1 text-xs font-medium capitalize transition-colors ${
                roleFilter === r ? "bg-amber-dim text-amber" : "text-muted hover:text-ink"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-hairline bg-panel">
        {filtered.length === 0 ? (
          <EmptyState icon={UsersIcon} title="No users match" sub="Try a different search or filter." />
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-hairline text-xs uppercase tracking-wide text-faint">
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {filtered.map((u) => (
                <tr
                  key={u._id}
                  onClick={() => setSelectedUser(u)}
                  className="cursor-pointer hover:bg-panel-raised"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-panel-raised font-mono text-[10px] font-semibold text-muted">
                        {initials(u.name)}
                      </div>
                      <span className="font-medium text-ink">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    <div>{u.email}</div>
                    <div className="text-xs text-faint font-mono">{u.phone}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${ROLE_STYLE[u.role] || ROLE_STYLE.customer}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1 text-xs">
                      <span className={u.isVerified ? "text-good" : "text-faint"}>
                        {u.isVerified ? "Verified" : "Unverified"}
                      </span>
                      {!u.isActive && <span className="text-bad">Deactivated</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-faint font-mono">{formatDate(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedUser && (
        <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} />
      )}
    </div>
  )
}