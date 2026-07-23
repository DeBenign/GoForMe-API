import { createContext, useContext, useState, useCallback, useEffect } from "react"
import api from "../lib/api"
import { useAuth } from "./AuthContext"

const RunnerProfileContext = createContext(null)

export function RunnerProfileProvider({ children }) {
  const { user } = useAuth()
  const [runner, setRunner] = useState(null)
  const [status, setStatus] = useState("loading") // loading | none | pending | rejected | approved
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    if (!user) {
      setStatus("none")
      return
    }
    setStatus("loading")
    try {
      const { data } = await api.get("/runners/me")
      setRunner(data.data)
      setStatus(data.data.status) // "pending" | "approved" | "rejected"
    } catch (err) {
      if (err.response?.status === 404) {
        setRunner(null)
        setStatus("none") // hasn't applied yet
      } else {
        setError(err.response?.data?.message || "Couldn't load your runner profile")
      }
    }
  }, [user])

  useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <RunnerProfileContext.Provider value={{ runner, status, error, refresh }}>
      {children}
    </RunnerProfileContext.Provider>
  )
}

export function useRunnerProfile() {
  const ctx = useContext(RunnerProfileContext)
  if (!ctx) throw new Error("useRunnerProfile must be used within RunnerProfileProvider")
  return ctx
}