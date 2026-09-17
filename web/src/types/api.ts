/** Unified backend response format ApiResponse<T>. */
export interface ApiResponse<T> {
  code: number
  message: string
  data: T | null
}

/** Token data returned after login or refresh. */
export interface TokenData {
  access_token: string
  refresh_token: string
  token_type: string
}

/** User profile. */
export interface UserProfile {
  id: number
  email: string
  nickname: string | null
  avatar: string | null
  created_at: string
}

/** User login information. */
export interface User {
  id: number
  email: string
  nickname?: string | null
  avatar?: string | null
}

/** Learning goal information. */
export interface Goal {
  id: number
  title: string
  description: string | null
  level: string | null
  start_date: string | null
  end_date?: string | null
  target_level: string | null
  period: string | null
}
