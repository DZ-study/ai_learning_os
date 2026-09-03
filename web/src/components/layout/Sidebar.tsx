import Logo from "@/assets/svg/logo.svg?react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar
} from "@/components/ui/sidebar"
import { goalKeys } from "@/pages/goal/queryKeys"
import { getGoals } from "@/services/goal"
import { useGoalStore } from '@/stores/goalStore'
import type { Goal } from '@/types/goal'
import { useQuery } from "@tanstack/react-query"
import { Bot, GraduationCap, LayoutDashboard, Network, Target } from "lucide-react"
import { useTranslation } from "react-i18next"
import { NavLink, useLocation } from "react-router-dom"


export const menuItems = [
  { key: "dashboard", path: "/", icon: LayoutDashboard, exact: true },
  { key: "goal", path: "/study_goal", icon: Target },
  { key: "learning", path: "/learning", icon: Target },
  { key: "agent", path: "/agent", icon: Bot },
  { key: "tutor", path: "/ai", icon: GraduationCap },
  { key: "knowledge", path: "/knowledge", icon: Network },
]

export default function MainSidebar() {
  const { t } = useTranslation()
  const location = useLocation()
  const { isMobile, setOpenMobile } = useSidebar()
  const { data: goals = [], isLoading } = useQuery({ queryKey: goalKeys.list(), queryFn: getGoals })
  const closeOnMobile = () => { if (isMobile) setOpenMobile(false) }
  const { setCurrentGoal } = useGoalStore()

  const handleClick = (goal: Goal) => {
    setCurrentGoal(goal)
    closeOnMobile()
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 justify-center border-b px-3">
        <div className="flex items-center gap-2.5">
          <Logo className="size-6 shrink-0" />
          <span className="truncate text-xl font-semibold tracking-tight group-data-[collapsible=icon]:hidden">AI-Learning-OS</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {menuItems.map((item) => item.key === "learning" ? <SidebarGroup key={item.key}>
          <SidebarGroupLabel className="text-sm text-sidebar-foreground">我的目标</SidebarGroupLabel>
          <SidebarGroupAction>
            {/* <Plus className="cursor-pointer" /> <span className="sr-only">Add Project</span> */}
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* 加载中 / 暂无目标 的提示保持不变 */}
              {isLoading && (
                <SidebarMenuSubItem>
                  <span className="px-2 text-xs text-muted-foreground">Loading…</span>
                </SidebarMenuSubItem>
              )}
              {!isLoading && goals.length === 0 && (
                <SidebarMenuSubItem>
                  <span className="px-2 text-xs text-muted-foreground">暂无目标</span>
                </SidebarMenuSubItem>
              )}
              {/* 核心修改：遍历目标列表 */}
              {goals.map((goal) => (
                <SidebarMenuItem key={goal.id}>
                  <SidebarMenuButton
                    render={
                      <NavLink
                        to={`/goals/${goal.id}/agent`}
                        onClick={() => handleClick(goal)}
                      />
                    }
                    isActive={location.pathname === `/goals/${goal.id}/agent`}
                    tooltip={goal.title} // 关键：设置 tooltip，收起时悬浮显示目标名称
                    className="transition-colors"
                  >
                    {/* 关键：在收起状态下显示一个图标，展开状态下显示文字 */}
                    <Target className="size-4" />
                    <span className="truncate">{goal.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup> :
          <SidebarGroup className="p-1" key={item.key}>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    render={<NavLink to={item.path} end={item.path === "/"} onClick={closeOnMobile} />}
                    isActive={item.path === "/" ? location.pathname === "/" : location.pathname.startsWith(item.path)}
                    tooltip={t(`menu.${item.key}`)}
                    className="transition-colors"
                  >
                    <item.icon /><span className='text-base'>{t(`menu.${item.key}`)}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>)}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
