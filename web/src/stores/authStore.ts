import { authService } from "@/services/auth"
import type { TokenData, UserProfile } from "@/types/api"
import {
  getAccessToken,
  clearTokens as removeTokens,
  setTokens as storeTokens,
} from "@/utils/token"
import { create } from "zustand"

interface AuthState {
  user: UserProfile | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (tokens: TokenData) => Promise<void>
  logout: () => void
  fetchUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isLoading: getAccessToken() !== null,
  isAuthenticated: getAccessToken() !== null,

  login: async (tokens: TokenData) => {
    storeTokens(tokens)
    set({ isLoading: true })
    const result = await authService.fetchUser()
    if (result.success && result.data) {
      set({ user: result.data, isAuthenticated: true, isLoading: false })
    } else {
      set({ isLoading: false })
    }
  },

  logout: () => {
    removeTokens()
    set({ user: null, isAuthenticated: false, isLoading: false })
  },

  fetchUser: async () => {
    if (!getAccessToken()) {
      set({ isLoading: false })
      return
    }
    set({ isLoading: true })
    try {
      const result = await authService.fetchUser()
      if (result.success && result.data) {
        set({ user: result.data, isAuthenticated: true, isLoading: false })
      } else {
        throw new Error(result.message)
      }
    } catch {
      removeTokens()
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },
}))
