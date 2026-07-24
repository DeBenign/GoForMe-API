import { createContext, useContext, useState, useCallback } from "react"
import api, { setTokens, clearTokens } from "../lib/api"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("gfm_runner_user")
    return raw ? JSON.parse(raw) : null
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const clearError = () => setError(null)

  const login = useCallback(async (email, password) => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.post("/auth/login", { email, password })
      if (!data.success) {
        setError(data.message || "Login failed")
        return false
      }
      // Admins have their own console; customers who haven't applied yet
      // still log in here (role stays "customer" until an admin approves
      // their runner application) so they can see the apply/pending screens.
      if (data.user.role === "admin") {
        setError("This is an admin details you supply. Please use the admin webpage/route instead.")
        return false
      }
      setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken })
      localStorage.setItem("gfm_runner_user", JSON.stringify(data.user))
      setUser(data.user)
      return true
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't reach the server. Check your connection.")
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout")
    } catch {
      // best-effort
    }
    clearTokens()
    setUser(null)
  }, [])

  const refreshUser = useCallback((updated) => {
    localStorage.setItem("gfm_runner_user", JSON.stringify(updated))
    setUser(updated)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshUser, loading, error, clearError }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}