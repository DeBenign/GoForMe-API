import { createContext, useContext, useState, useCallback } from "react"
import api, { setTokens, clearTokens } from "../lib/api"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("gfm_user")
    return raw ? JSON.parse(raw) : null
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const clearError = () => setError(null)

  // Returns { userId } on success so the caller can move to OTP verification.
  const register = useCallback(async ({ name, email, phone, password }) => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.post("/auth/register", { name, email, phone, password })
      if (!data.success) {
        setError(data.message || "Couldn't create your account.")
        return null
      }
      return { userId: data.userId, email }
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't reach the server. Check your connection.")
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const verifyOtp = useCallback(async (email, otp) => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.post("/auth/verify-otp", { email, otp })
      if (!data.success) {
        setError(data.message || "That code didn't work.")
        return false
      }
      return true
    } catch (err) {
      setError(err.response?.data?.message || "That code didn't work.")
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const resendOtp = useCallback(async (email) => {
    setError(null)
    try {
      const { data } = await api.post("/auth/resend-otp", { email })
      return data.success
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't resend the code.")
      return false
    }
  }, [])

  const login = useCallback(async (email, password) => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.post("/auth/login", { email, password })
      if (!data.success) {
        setError(data.message || "Login failed")
        return false
      }
      // FIX: previously any role could log into the customer app with no
      // signal anything was off. Runner and admin accounts belong on their
      // own frontends.
      if (data.user.role === "admin") {
        setError("This is an admin account. Please use the dispatch console instead.")
        return false
      }
      if (data.user.role === "runner") {
        setError("This is a runner account. Please use the runner app instead.")
        return false
      }
      setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken })
      localStorage.setItem("gfm_user", JSON.stringify(data.user))
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

  return (
    <AuthContext.Provider value={{ user, register, verifyOtp, resendOtp, login, logout, loading, error, clearError }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}