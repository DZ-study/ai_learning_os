import { SidebarTrigger } from '@/components/ui/sidebar'
import { useGoalStore } from '@/stores/goalStore'
import type { Goal } from '@/types/goal'
import { Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface WorkspaceHeaderProps {
  onAddNote: () => void
}

export default function WorkspaceHeader({ onAddNote }: WorkspaceHeaderProps) {
  const { t } = useTranslation()
  const { getCurrentGoal } = useGoalStore()
  const [goal, setGoal] = useState<Goal | null>(null)

  useEffect(() => {
    const goal = getCurrentGoal()
    setGoal(goal)
  }, [])

  return (
    <header className="flex h-[66px] shrink-0 items-center justify-between border-b border-[#e9e6e2] bg-[#fbfaf8]/95 px-5 backdrop-blur-sm">
      <div className="flex items-center gap-2.5">
        <SidebarTrigger
          aria-label={t("workspace.toggle_sidebar")}
          title={t("workspace.toggle_sidebar")}
          className="size-8 text-[#7b7a7d]"
        />
        <div className="flex h-8 items-center gap-2 rounded-lg border border-[#dedbd6] bg-white px-3 text-[13px] font-medium text-[#27364f] shadow-[0_1px_2px_rgba(35,42,56,0.03)]">
          <Sparkles className="size-3.5 text-[#7c65e8]" />
          <span>{goal?.title}</span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {/* <Button
          variant="outline"
          size="sm"
          onClick={onAddNote}
          className="h-8 gap-1.5 rounded-lg border-[#dedbd6] bg-white px-2.5 text-xs text-[#47546a] hover:bg-[#f5f2ee]"
        >
          <Plus className="size-3.5" />
          {t("workspace.add_content")}
        </Button>
        <Button variant="ghost" size="icon-sm" className="text-[#7b7a7d]" title={t("workspace.more_actions")} aria-label={t("workspace.more_actions")}>
          <MoreHorizontal className="size-4" />
        </Button>
        <Button variant="ghost" size="icon-sm" className="text-[#7b7a7d]" title={t("workspace.fullscreen")} aria-label={t("workspace.fullscreen")}>
          <Maximize2 className="size-3.5" />
        </Button> */}
      </div>
    </header>
  )
}
