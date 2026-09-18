import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useGoalStore } from '@/stores/goalStore'
import { BookOpen, FileText, Headphones, Layers3, Search, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const recentNotes: any[] = []

const sideLabelClass = "flex items-center gap-1 text-[12px] uppercase tracking-[0.15em] text-[#aaa5a5]"

export default function LearningSidebar() {
  const items = useWorkspaceStore((state) => state.items)
  const selectedItemId = useWorkspaceStore((state) => state.selectedItemId)
  const selectItem = useWorkspaceStore((state) => state.selectItem)
  const openCourseDetail = useWorkspaceStore((state) => state.openCourseDetail)
  const goal = useGoalStore((state) => state.currentGoal)
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <Sidebar collapsible="icon" variant="sidebar" className="h-full">
      <SidebarHeader className="h-[66px] justify-center border-b border-[#ebe8e5] bg-[#faf9f7] px-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#232d49] text-white shadow-sm">
            <Sparkles className="size-4" />
          </div>
          <span className="truncate font-serif text-[20px] tracking-[-0.03em] text-[#25324c] group-data-[collapsible=icon]:hidden">
            Pilot
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-[#faf9f7]">
        <SidebarGroup className="pb-1">
          <SidebarGroupContent>
            <div className="relative group-data-[collapsible=icon]:hidden">
              <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#aaa5a5]" />
              <SidebarInput
                placeholder={t("workspace.search_placeholder")}
                className="h-8 rounded-lg border-[#eeeae7] bg-[#f8f7f5] pl-9 text-xs placeholder:text-[#aaa5a5]"
              />
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="pt-1">
          <SidebarGroupLabel className={sideLabelClass}>
            <Layers3 />
            {t("workspace.courseNav")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const label = t(item.title, { defaultValue: item.title })
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={item.id === selectedItemId}
                      tooltip={label}
                      onClick={() => {
                        if (item.type === 'course-plan') {
                          openCourseDetail(item.id)
                          if (goal?.id) navigate(`/space/${goal.id}/detail`)
                        } else {
                          selectItem(item.id)
                        }
                      }}
                      className="text-[#77747a] data-active:bg-[#eeebff] data-active:text-[#6655b3]"
                    >
                      {item.type === 'note' ? <FileText /> : <BookOpen />}
                      <span>{label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="pt-1">
          <SidebarGroupLabel className={sideLabelClass}>
            <Headphones />
            {t("workspace.recent")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {recentNotes.map((note) => (
                <SidebarMenuItem key={note}>
                  <SidebarMenuButton
                    tooltip={t(note, { defaultValue: note })}
                    className="text-[#77747a]"
                  >
                    <FileText />
                    <span>{t(note, { defaultValue: note })}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator className="bg-[#ebe8e5]" />
      <SidebarFooter className="bg-[#faf9f7] p-2">
        <div className="flex items-center justify-center rounded-md py-2 text-[10px] text-[#aaa5a5] group-data-[collapsible=icon]:hidden">
          {t("workspace.organize_hint")}
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
