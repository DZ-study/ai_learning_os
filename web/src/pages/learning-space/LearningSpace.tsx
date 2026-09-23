import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import {
  Group,
  Panel,
  Separator,
} from 'react-resizable-panels'
import { createSpaceNode, getSpaceNodes } from '@/services/goal'
import { spaceNodeKeys } from '@/query/keys'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useChatStore } from '@/stores/chatStore'
import { useGoalStore } from '@/stores/goalStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { getNextAvailablePosition } from '@/utils/workspace-position'
import { useCallback, useEffect } from 'react'
import type { CanvasView } from '@/stores/workspaceStore'
import type { SpaceNode } from '@/types/workspace'

import LearningCanvas from './canvas/LearningCanvas'
import ChatPanel from './chat/ChatPanel'
import FloatingChat from './chat/FloatingChat'
import FloatingToolbar from './FloatingToolbar'
import LearningSidebar from './sidebar/LearningSidebar'
import WorkspaceHeader from './WorkspaceHeader'

interface LearningSpaceProps {
  initialView?: CanvasView
}

export default function LearningSpace({ initialView = 'workspace' }: LearningSpaceProps) {
  const loadNodes = useWorkspaceStore((state) => state.loadNodes)
  const openCourseDetail = useWorkspaceStore((state) => state.openCourseDetail)
  const items = useWorkspaceStore((state) => state.items)
  const goal = useGoalStore((state) => state.currentGoal)
  const chatOpen = useChatStore((state) => state.isOpen)
  const chatMode = useChatStore((state) => state.mode)
  const setChatOpen = useChatStore((state) => state.setOpen)
  const setChatMode = useChatStore((state) => state.setMode)
  const queryClient = useQueryClient()
  const { data: nodes } = useQuery({
    queryKey: spaceNodeKeys.list(goal?.id ?? 0),
    queryFn: async () => (await getSpaceNodes(goal!.id)).data,
    enabled: Boolean(goal?.id),
  })
  const { mutate: createNote } = useMutation({
    mutationFn: ({ goalId, position }: { goalId: number; position: { x: number; y: number } }) =>
      createSpaceNode(goalId, {
        type: 'note',
        title: 'workspace.new_note',
        content: { content: '', color: 'yellow' },
        position,
      }),
    onSuccess: ({ data }, variables) => {
      queryClient.setQueryData<SpaceNode[]>(
        spaceNodeKeys.list(variables.goalId),
        (current = []) => [...current, data],
      )
    },
  })

  const addNote = useCallback(() => {
    if (!goal?.id) return
    const position = getNextAvailablePosition(items)
    createNote({ goalId: goal.id, position })
  }, [createNote, goal?.id, items])

  const handleMinimizeChat = useCallback(() => {
    setChatOpen(false)
    setChatMode('popup')
  }, [setChatMode, setChatOpen])

  useEffect(() => {
    if (!goal?.id) {
      loadNodes([])
      return
    }

    if (!nodes) return

    loadNodes(nodes)
    if (initialView === 'course_detail') {
      const firstCourse = nodes.find((node) => node.type === 'course')
      if (firstCourse) openCourseDetail(String(firstCourse.id))
    }
  }, [goal?.id, initialView, loadNodes, nodes, openCourseDetail])

  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden bg-[#fbfaf9]">
      <SidebarProvider
        defaultOpen
        className="!min-h-0 h-full min-h-0 flex-1"
      >
        <LearningSidebar />
        <SidebarInset className="min-h-0 h-[100vh] min-w-0 overflow-hidden bg-[#fbfaf9]">
          <div className="relative h-full min-h-0 w-full">
            <Group orientation="horizontal" className="h-full min-h-0">
              <Panel
                id="canvas"
                defaultSize={chatOpen && chatMode === 'popup' ? '70%' : '100%'}
                minSize="45%"
                className="min-w-0"
              >
                <div className="relative flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
                  <WorkspaceHeader onAddNote={addNote} />
                  <div className="relative h-full min-h-0 min-w-0 flex-1">
                    <LearningCanvas />
                    <FloatingToolbar onAddNote={addNote} />
                  </div>
                </div>
              </Panel>

              {chatOpen && chatMode === 'popup' && <Separator className="group relative w-1">
                <div className="absolute inset-y-0 -left-1 -right-1 cursor-col-resize" />
                <div className="absolute left-1/2 top-1/2 h-10 w-1 -translate-x-1/2 rounded-full transition-colors group-hover:bg-[#c9c2bd]" />
              </Separator>}
              {chatOpen && chatMode === 'popup' && <Panel
                id="chat"
                defaultSize="30%"
                minSize="18%"
                maxSize="45%"
                className="min-w-0"
              >
                <ChatPanel
                  onMinimize={handleMinimizeChat}
                  onMaximize={() => setChatMode('drawer')}
                  isMaximized={false}
                />
              </Panel>}
            </Group>

            <FloatingChat
              docked={chatOpen && chatMode === 'popup'}
              onMinimize={handleMinimizeChat}
            />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
