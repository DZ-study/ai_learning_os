import { Toaster } from "@/components/ui/toast"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Outlet } from "react-router-dom"

const queryClient = new QueryClient()

function App() {
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
