/** 后端统一响应格式 ApiResponse<T> */
export interface ApiResponse<T> {
  code: number
  message: string
  data: T | null
}

/** 登录 / 刷新后返回的 token 数据 */
export interface TokenData {
  access_token: string
  refresh_token: string
  token_type: string
}

/** 用户个人信息 */
export interface UserProfile {
  id: number
  email: string
  nickname: string | null
  avatar: string | null
  created_at: string
}

/**用户登录信息 */
export interface User {
  id: number
  email: string
  nickname?: string | null
  avatar?: string | null
}

/**学习目标信息 */
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
