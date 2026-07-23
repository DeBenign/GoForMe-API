import axios from "axios"

// Base URL — set VITE_API_BASE_URL in .env for production.
// Falls back to local dev backend per the API README (localhost:5000/api/v1).
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1"

const api = axios.create({ baseURL: BASE_URL })

function getTokens() {
  return {
    accessToken: localStorage.getItem("gfm_access_token"),
    refreshToken: localStorage.getItem("gfm_refresh_token"),
  }
}

export function setTokens({ accessToken, refreshToken }) {
  if (accessToken) localStorage.setItem("gfm_access_token", accessToken)
  if (refreshToken) localStorage.setItem("gfm_refresh_token", refreshToken)
}

export function clearTokens() {
  localStorage.removeItem("gfm_access_token")
  localStorage.removeItem("gfm_refresh_token")
  localStorage.removeItem("gfm_admin_user")
}

api.interceptors.request.use((config) => {
  const { accessToken } = getTokens()
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
  return config
})

// On 401, try the refresh-token flow once. auth.routes returns a fresh
// accessToken only (POST /auth/refresh-token) — refreshToken itself is
// long-lived and reused until logout.
let refreshingPromise = null

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const { refreshToken } = getTokens()
      if (!refreshToken) {
        clearTokens()
        return Promise.reject(error)
      }
      try {
        if (!refreshingPromise) {
          refreshingPromise = axios
            .post(`${BASE_URL}/auth/refresh-token`, { refreshToken })
            .then((r) => r.data)
            .finally(() => {
              refreshingPromise = null
            })
        }
        const data = await refreshingPromise
        if (data?.accessToken) {
          setTokens({ accessToken: data.accessToken })
          original.headers.Authorization = `Bearer ${data.accessToken}`
          return api(original)
        }
      } catch (refreshErr) {
        clearTokens()
        window.location.href = "/login"
      }
    }
    return Promise.reject(error)
  }
)

export default api
