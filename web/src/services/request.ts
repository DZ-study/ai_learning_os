import type { ApiResponse, TokenData } from "@/types/api"
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "@/utils/token"
import axios from "axios"

import { toast } from "@/components/ui/toast"
import i18next from "@/i18n"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  headers: { "Content-Type": "application/json" },
})

// ── Request interceptor: attach access_token ──────────
api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Response interceptor: refresh on 401 ──────────────
let isRefreshing = false
let pendingQueue: Array<{
  resolve: (token: string) => void
  reject: (err: unknown) => void
}> = []

function processQueue(error: unknown, token: string | null) {
  pendingQueue.forEach((p) => {
    if (error) {
      p.reject(error)
    } else {
      p.resolve(token!)
    }
  })
  pendingQueue = []
}

function redirectToLogin() {
  clearTokens()
  if (window.location.pathname !== "/login") {
    window.history.replaceState({}, "", "/login")
    window.dispatchEvent(new PopStateEvent("popstate"))
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    const status = error.response?.status
    console.log("status： ", status)

    if ([502, 503, 504].includes(status)) {
      // Return server errors directly.
      toast.add({
        type: "error",
        description: i18next.t("error.server"),
      })
      return Promise.reject(error)
    }

    // Handle 401 responses except the refresh endpoint itself.
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      const refreshToken = getRefreshToken()

      if (!refreshToken) {
        redirectToLogin()
        return Promise.reject(error)
      }

      // Queue requests while a token refresh is in progress.
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          pendingQueue.push({ resolve, reject })
        }).then((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const { data } = await axios.post<ApiResponse<TokenData>>(
          `${api.defaults.baseURL}/auth/refresh`,
          { refresh_token: refreshToken },
        )

        if (data.code === 0 && data.data) {
          setTokens(data.data)
          processQueue(null, data.data.access_token)
          originalRequest.headers.Authorization = `Bearer ${data.data.access_token}`
          return api(originalRequest)
        }

        // Refresh failed.
        redirectToLogin()
        processQueue(new Error(i18next.t("error.refresh_failed")), null)
        return Promise.reject(error)
      } catch (refreshError) {
        redirectToLogin()
        processQueue(refreshError, null)
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)

export default api
