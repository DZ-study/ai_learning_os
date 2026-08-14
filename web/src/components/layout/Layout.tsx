import { Button } from "@/components/ui/button"
import { useSidebarStore } from "@/stores/sidebarStore"
import { PanelLeftOpen } from "lucide-react"
import { Group, Panel } from "react-resizable-panels"
import { Outlet } from "react-router-dom"
import Header from "./Header"
import Sidebar from "./Sidebar"

export default function Layout() {
  const { collapsed, toggle } = useSidebarStore()

  return (
    <div className="relative flex h-screen overflow-hidden bg-background">
      <Group>
        <Panel minSize={collapsed ? 0 : 300} maxSize={400} defaultSize={250}>
          <Sidebar />
          {collapsed && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggle}
              className="absolute bottom-4 left-4 z-10 rounded-lg shadow-md"
              aria-label="Expand sidebar"
            >
              <PanelLeftOpen className="size-4" />
            </Button>
          )}
        </Panel>
        <Panel>
          <Header />
          <main className="flex-1 overflow-y-auto p-4">
            <Outlet />
          </main>
        </Panel>
      </Group>
    </div>
  )
}
