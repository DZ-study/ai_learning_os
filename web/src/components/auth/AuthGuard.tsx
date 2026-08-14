import { useAuthStore } from "@/stores/authStore"
import { useEffect } from "react"
import { Navigate, Outlet } from "react-router-dom"

export default function AuthGuard() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isLoading = useAuthStore((s) => s.isLoading)
  const { fetchUser } = useAuthStore()

  useEffect(() => {
    fetchUser()
  }, [])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground text-sm">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
