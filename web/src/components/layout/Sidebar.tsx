import Logo from "@/assets/svg/logo.svg?react"
import { Button } from "@/components/ui/button"
import { useSidebarStore } from "@/stores/sidebarStore"
import {
  Bot,
  ChevronLeft,
  GraduationCap,
  LayoutDashboard,
  Network,
  Target,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { NavLink } from "react-router-dom"

interface MenuItem {
  key: string
  path: string
  icon: typeof LayoutDashboard
}

const menuItems: MenuItem[] = [
  { key: "dashboard", path: "/", icon: LayoutDashboard },
  { key: "goals", path: "/goals", icon: Target },
  { key: "agent", path: "/agent", icon: Bot },
  { key: "tutor", path: "/ai", icon: GraduationCap },
  { key: "knowledge", path: "/knowledge", icon: Network },
]

export default function Sidebar() {
  const { t } = useTranslation()
  const toggle = useSidebarStore((s) => s.toggle)

  return (
    <aside className="flex h-full flex-col border-r border-(--border) bg-(--sidebar-primary) text-(--sidebar-primary-foreground)">
      {/* Header: Logo + Project name */}
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-border px-3">
        <Logo className="size-8 shrink-0" />
        <span className="truncate text-xl font-semibold tracking-tight">
          AI-Learning-OS
        </span>
        <Button
          variant="ghost"
          size="icon-lg"
          onClick={toggle}
          className="ml-auto shrink-0"
          aria-label="Collapse sidebar"
        >
          <ChevronLeft className="size-6" />
        </Button>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto py-2">
        <ul className="space-y-0.5 px-2">
          {menuItems.map((item) => (
            <li key={item.key}>
              <NavLink
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-2.5 rounded-lg px-3.5 py-3 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground border-l-6 border-l-(--primary)"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                  ].join(" ")
                }
              >
                <item.icon className="size-4 shrink-0" />
                <span className="truncate">{t(`menu.${item.key}`)}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
