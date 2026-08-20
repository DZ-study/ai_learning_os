import { Toaster } from "@/components/ui/toast"
import { useAuthStore } from '@/stores/authStore'
import { getAccessToken } from '@/utils/token'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Outlet } from "react-router-dom"

const queryClient = new QueryClient()



function App() {
  const { fetchUser } = useAuthStore()

  useEffect(() => {
    if (getAccessToken()) fetchUser()
  }, [fetchUser])

  return (
    <div className="min-h-screen bg-background">
      <QueryClientProvider client={queryClient}>
        <Outlet />
        <Toaster />
      </QueryClientProvider>
    </div>
  )
}

export default App
