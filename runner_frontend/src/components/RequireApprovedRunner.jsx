import { Navigate } from "react-router-dom"
import { useRunnerProfile } from "../context/RunnerProfileContext"
import Spinner from "./Spinner"

// Wraps the approved-runner app shell. Anyone logged in but not yet an
// approved runner gets routed to the apply form or the pending screen
// instead of the dashboard.
export default function RequireApprovedRunner({ children }) {
  const { status } = useRunnerProfile()

  if (status === "loading") return <Spinner label="Checking your runner status…" />
  if (status === "none") return <Navigate to="/apply" replace />
  if (status === "pending" || status === "rejected") return <Navigate to="/pending" replace />
  return children
}