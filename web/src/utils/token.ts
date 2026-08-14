import type { TokenData } from "@/types/api"

const ACCESS_KEY = "access_token"
const REFRESH_KEY = "refresh_token"

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY)
}

export function setTokens(data: TokenData): void {
  localStorage.setItem(ACCESS_KEY, data.access_token)
  localStorage.setItem(REFRESH_KEY, data.refresh_token)
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}
