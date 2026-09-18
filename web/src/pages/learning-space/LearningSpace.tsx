import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import {
  Group,
  Panel,
  Separator,
} from 'react-resizable-panels'

import { createSpaceNode, getSpaceNodes } from '@/services/goal'
import { useGoalStore } from '@/stores/goalStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { getNextAvailablePosition } from '@/utils/workspace-position'
import { useCallback, useEffect } from 'react'
import type { CanvasView } from '@/stores/workspaceStore'

import LearningCanvas from './canvas/LearningCanvas'
import ChatPanel from './chat/ChatPanel'
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
          <Group orientation="horizontal" className="h-full min-h-0">
            <Panel id="canvas" defaultSize="70%" minSize="45%">
              <div className="relative flex h-full min-h-0 flex-col overflow-hidden">
                <WorkspaceHeader onAddNote={addNote} />
                <div className="relative h-full min-h-0 flex-1">
                  <LearningCanvas />
                  <FloatingToolbar onAddNote={addNote} />
                </div>
              </div>
            </Panel>
            <Separator className="group relative w-1">
              <div className="absolute inset-y-0 -left-1 -right-1 cursor-col-resize" />
              <div className="absolute left-1/2 top-1/2 h-10 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors group-hover:bg-[#c9c2bd]" />
            </Separator>
            <Panel id="chat" defaultSize="30%" minSize="18%" maxSize="35%">
              <ChatPanel />
            </Panel>
          </Group>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
