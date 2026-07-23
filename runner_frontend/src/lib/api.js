import axios from "axios"

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1"

const api = axios.create({ baseURL: BASE_URL })

export function getTokens() {
  return {
    accessToken: localStorage.getItem("gfm_runner_access_token"),
    refreshToken: localStorage.getItem("gfm_runner_refresh_token"),
  }
}

export function setTokens({ accessToken, refreshToken }) {
  if (accessToken) localStorage.setItem("gfm_runner_access_token", accessToken)
  if (refreshToken) localStorage.setItem("gfm_runner_refresh_token", refreshToken)
}

export function clearTokens() {
  localStorage.removeItem("gfm_runner_access_token")
  localStorage.removeItem("gfm_runner_refresh_token")
  localStorage.removeItem("gfm_runner_user")
}

api.interceptors.request.use((config) => {
  const { accessToken } = getTokens()
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
  return config
})

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
      } catch {
        clearTokens()
        window.location.href = "/login"
      }
    }
    return Promise.reject(error)
  }
)

export default api
export { BASE_URL }