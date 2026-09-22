import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { createSpaceNode, getSpaceNodes } from '@/services/goal'
import { useGoalStore } from '@/stores/goalStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { getNextAvailablePosition } from '@/utils/workspace-position'
import { useCallback, useEffect } from 'react'
import type { CanvasView } from '@/stores/workspaceStore'

import LearningCanvas from './canvas/LearningCanvas'
import FloatingChat from './chat/FloatingChat'
import FloatingToolbar from './FloatingToolbar'
import LearningSidebar from './sidebar/LearningSidebar'
import WorkspaceHeader from './WorkspaceHeader'

interface LearningSpaceProps {
  initialView?: CanvasView
}

export default function LearningSpace({ initialView = 'workspace' }: LearningSpaceProps) {
  const loadNodes = useWorkspaceStore((state) => state.loadNodes)
  const upsertNode = useWorkspaceStore((state) => state.upsertNode)
  const openCourseDetail = useWorkspaceStore((state) => state.openCourseDetail)
  const items = useWorkspaceStore((state) => state.items)
  const goal = useGoalStore((state) => state.currentGoal)

  const addNote = useCallback(() => {
    if (!goal?.id) return
    const position = getNextAvailablePosition(items)
    void createSpaceNode(goal.id, {
      type: 'note',
      title: 'workspace.new_note',
      content: { content: '', color: 'yellow' },
      position,
    }).then(({ data }) => upsertNode(data))
  }, [goal?.id, items, upsertNode])

  useEffect(() => {
    let cancelled = false
    if (!goal?.id) {
      loadNodes([])
      return () => { cancelled = true }
    }
    void getSpaceNodes(goal.id).then(({ data }) => {
      if (cancelled) return

      loadNodes(data)
      if (initialView === 'course_detail') {
        const firstCourse = data.find((node) => node.type === 'course')
        if (firstCourse) openCourseDetail(String(firstCourse.id))
      }
    })
    return () => { cancelled = true }
  }, [goal?.id, initialView, loadNodes, openCourseDetail])

  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden bg-[#fbfaf9]">
      <SidebarProvider
        defaultOpen
        className="!min-h-0 h-full min-h-0 flex-1"
      >
        <LearningSidebar />
        <SidebarInset className="min-h-0 h-[100vh] min-w-0 overflow-hidden bg-[#fbfaf9]">
          <div className="relative h-full min-h-0 w-full">
            <div className="relative flex h-full min-h-0 flex-col overflow-hidden">
              <WorkspaceHeader onAddNote={addNote} />
              <div className="relative h-full min-h-0 flex-1">
                <LearningCanvas />
                <FloatingToolbar onAddNote={addNote} />
              </div>
            </div>
            <FloatingChat />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
