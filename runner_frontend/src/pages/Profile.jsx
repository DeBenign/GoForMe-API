import { User, Star, MapPin } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { useRunnerProfile } from "../context/RunnerProfileContext"
import TopBar from "../components/TopBar"
import ReferralCard from "../components/ReferralCard"

export default function Profile() {
  const { user } = useAuth()
  const { runner } = useRunnerProfile()

  return (
    <div className="min-h-screen bg-base">
      <TopBar title="Profile" />
      <div className="mx-auto max-w-md px-5 py-5 space-y-4">
        <div className="rounded-2xl border border-hairline bg-panel p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-dim text-amber">
              <User size={20} />
            </div>
            <div>
              <div className="text-sm font-semibold text-ink">{user?.name}</div>
              <div className="text-xs text-faint">{user?.email}</div>
            </div>
          </div>

          <div className="space-y-2 border-t border-hairline pt-3 text-xs text-muted">
            <div className="flex items-center gap-2">
              <Star size={13} className="text-amber" />
              {runner?.rating?.toFixed?.(1) ?? "No ratings yet"}
              {runner?.completedJobs ? ` · ${runner.completedJobs} errands completed` : ""}
            </div>
            {runner?.address?.city && (
              <div className="flex items-center gap-2">
                <MapPin size={13} className="text-faint" />
                {runner.address.street ? `${runner.address.street}, ` : ""}{runner.address.city}, {runner.address.state}
              </div>
            )}
            {runner?.skills?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {runner.skills.map((s) => (
                  <span key={s} className="rounded-full border border-hairline px-2 py-0.5 text-[11px] text-muted">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <ReferralCard />
      </div>
    </div>
  )
}