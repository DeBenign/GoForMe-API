import { NavLink } from "react-router-dom"
import {
  LayoutGrid,
  Users,
  Package,
  UserCheck,
  Banknote,
  ShieldAlert,
  LogOut,
  Radio,
} from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { initials } from "../lib/format"

const NAV = [
  { to: "/", label: "Overview", icon: LayoutGrid, end: true },
  { to: "/orders", label: "Orders", icon: Package },
  { to: "/runners", label: "Runners", icon: UserCheck },
  { to: "/users", label: "Users", icon: Users },
  { to: "/payouts", label: "Payouts", icon: Banknote },
  { to: "/disputes", label: "Disputes", icon: ShieldAlert },
]

export default function Sidebar() {
  const { user, logout } = useAuth()

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-hairline bg-panel">
      <div className="flex items-center gap-2 border-b border-hairline px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-dim text-amber">
          <Radio size={16} strokeWidth={2.5} />
        </div>
        <div>
          <div className="font-display text-sm font-semibold leading-none tracking-tight">
            GoForMe
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-widest text-faint">
            Dispatch Console
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-amber-dim text-amber"
                  : "text-muted hover:bg-panel-raised hover:text-ink"
              }`
            }
          >
            <Icon size={16} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-hairline p-3">
        <div className="flex items-center gap-2.5 rounded-md px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-panel-raised font-mono text-xs font-semibold text-muted">
            {initials(user?.name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-ink">{user?.name}</div>
            <div className="truncate text-xs text-faint">{user?.email}</div>
          </div>
          <button
            onClick={logout}
            title="Log out"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-faint hover:bg-bad-dim hover:text-bad transition-colors"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}
