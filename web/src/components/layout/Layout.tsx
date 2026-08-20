import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Outlet } from "react-router-dom"
import Header from "./Header"
import Sidebar from "./Sidebar"

export default function Layout() {
  return (
    <SidebarProvider style={{ '--sidebar-width-icon': '4rem' } as React.CSSProperties}>
      <Sidebar />
      <SidebarInset className="h-svh overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4"><Outlet /></main>
      </SidebarInset>
    </SidebarProvider>
  )
}
