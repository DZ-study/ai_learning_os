import type { ApiResponse, TokenData, UserProfile } from "@/types/api"
import api from "./request"

interface ServiceResult<T = unknown> {
  success: boolean
  message?: string
  data?: T
}

export const authService = {
  /** Send a verification code. */
  async sendCode(email: string): Promise<ServiceResult<{ email: string }>> {
    const { data } = await api.post<ApiResponse<{ email: string }>>(
      "/auth/send-code",
      { email },
    )
    return {
      success: data.code === 0,
      message: data.message,
      data: data.data ?? undefined,
    }
  },

  /** Log in with a verification code. */
  async login(email: string, code: string): Promise<ServiceResult<TokenData>> {
    const { data } = await api.post<ApiResponse<TokenData>>("/auth/login", {
      email,
      code,
    })
    return {
      success: data.code === 0,
      message: data.message,
      data: data.data ?? undefined,
    }
  },

  /** Fetch the current user. */
  async fetchUser(): Promise<ServiceResult<UserProfile>> {
    const { data } = await api.get<ApiResponse<UserProfile>>("/users/me")
    return {
      success: data.code === 0,
      message: data.message,
      data: data.data ?? undefined,
    }
  },
}
