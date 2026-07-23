import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

export default function RequireAdmin({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  // FIX: previously only checked that *someone* was logged in — any
  // authenticated customer or runner could load the admin dashboard UI.
  if (user.role !== "admin") return <Navigate to="/login" replace />
  return children
}