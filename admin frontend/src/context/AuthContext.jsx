import { createContext, useContext, useState, useCallback } from "react"
import api, { setTokens, clearTokens } from "../lib/api"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("gfm_admin_user")
    return raw ? JSON.parse(raw) : null
  })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const login = useCallback(async (email, password) => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.post("/auth/login", { email, password })
      if (!data.success) {
        setError(data.message || "Login failed")
        return false
      }
      if (data.user.role !== "admin") {
        setError("This account doesn't have dispatch console access.")
        return false
      }
      setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken })
      localStorage.setItem("gfm_admin_user", JSON.stringify(data.user))
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
      // best-effort — clear local state regardless
    }
    clearTokens()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout, error, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
