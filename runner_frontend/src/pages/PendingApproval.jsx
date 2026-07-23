import { Clock, XCircle } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { useRunnerProfile } from "../context/RunnerProfileContext"
import TopBar from "../components/TopBar"
import EmptyState from "../components/EmptyState"

export default function PendingApproval() {
  const { logout } = useAuth()
  const { runner, status, refresh } = useRunnerProfile()

  const rejected = status === "rejected"

  return (
    <div className="min-h-screen bg-base">
      <TopBar
        title="Application status"
        right={
          <button onClick={logout} className="text-xs font-medium text-faint hover:text-muted">
            Sign out
          </button>
        }
      />
      <div className="mx-auto max-w-md px-5 py-6">
        <EmptyState
          icon={rejected ? XCircle : Clock}
          title={rejected ? "Application not approved" : "Your application is under review"}
          sub={
            rejected
              ? runner?.rejectionReason || "An admin reviewed your application and it wasn't approved this time."
              : "An admin needs to verify your details before you can go online. This usually doesn't take long — check back soon."
          }
          action={
            <button
              onClick={refresh}
              className="mt-3 rounded-lg border border-hairline px-4 py-2 text-xs font-medium text-muted transition-colors hover:border-amber hover:text-amber"
            >
              Check again
            </button>
          }
        />
      </div>
    </div>
  )
}