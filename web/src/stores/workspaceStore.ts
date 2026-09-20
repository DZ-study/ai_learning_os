import { create } from 'zustand'
import { updateSpaceNodePosition } from '@/services/goal'

import type {
  CoursePlan,
  SpaceNode,
  WorkspaceItem,
  WorkspaceItemPosition,
  WorkspaceNote,
} from '@/types/workspace'

export type CanvasView = 'workspace' | 'course_detail'

const initialItems: WorkspaceItem[] = []

interface WorkspaceState {
  nodes: SpaceNode[]
  items: WorkspaceItem[]
  coursePlans: Record<string, CoursePlan>
  notes: Record<string, WorkspaceNote>
  selectedItemId: string | null
  currentCourseId: string | null
  canvasView: CanvasView
  zoom: number
  currentLessonId: string | null
  currentBlockId: string | null
  lessonProgress: Record<string, string[]>
  selectItem: (id: string | null) => void
  openCourseDetail: (id: string) => void
  setCanvasView: (view: CanvasView) => void
  updateItemPosition: (id: string, position: WorkspaceItemPosition) => Promise<void>
  updateNote: (id: string, content: string) => void
  addNote: () => void
  removeItem: (id: string) => void
  setZoom: (zoom: number) => void
  beginCoursePlanGeneration: () => void
  completeCoursePlanGeneration: () => void
  setCoursePlan: (course: CoursePlan) => void
  loadNodes: (nodes: SpaceNode[]) => void
  upsertNode: (node: SpaceNode) => void
  setCurrentLesson: (lessonId: string | null) => void
  setCurrentBlock: (blockId: string | null) => void
  completeBlock: (lessonId: string, blockId: string) => void
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  items: initialItems,
  coursePlans: {},
  nodes: [],
  notes: {},
  selectedItemId: '',
  currentCourseId: null,
  canvasView: 'workspace',
  zoom: 100,
  currentLessonId: null,
  currentBlockId: null,
  lessonProgress: {},

  setCurrentLesson: (lessonId) =>
    set({ currentLessonId: lessonId, currentBlockId: null }),

  setCurrentBlock: (blockId) => set({ currentBlockId: blockId }),

  completeBlock: (lessonId, blockId) =>
    set((state) => {
      const completed = state.lessonProgress[lessonId] ?? []
      if (completed.includes(blockId)) return state
      return {
        lessonProgress: {
          ...state.lessonProgress,
          [lessonId]: [...completed, blockId],
        },
      }
    }),

  selectItem: (id) => set((state) => ({
    selectedItemId: id,
    canvasView: id === state.currentCourseId ? state.canvasView : 'workspace',
  })),

  openCourseDetail: (id) => set({
    selectedItemId: id,
    currentCourseId: id,
    canvasView: 'course_detail',
  }),

  setCanvasView: (view) => set({ canvasView: view }),

  updateItemPosition: async (id, position) => {
    const state = get()
    const node = state.nodes.find((item) => String(item.id) === id)
    const previousPosition = state.items.find((item) => item.id === id)

    if (!node || !previousPosition) return

    set((current) => ({
      nodes: current.nodes.map((item) =>
        item.id === node.id ? { ...item, position } : item,
      ),
      items: current.items.map((item) =>
        item.id === id ? { ...item, ...position } : item,
      ),
    }))

    try {
      await updateSpaceNodePosition(node.goal_id, node.id, position)
    } catch {
      set((current) => ({
        nodes: current.nodes.map((item) =>
          item.id === node.id
            ? { ...item, position: { x: previousPosition.x, y: previousPosition.y } }
            : item,
        ),
        items: current.items.map((item) =>
          item.id === id
            ? { ...item, x: previousPosition.x, y: previousPosition.y }
            : item,
        ),
      }))
    }
  },

  updateNote: (id, content) =>
    set((state) => ({
      notes: {
        ...state.notes,
        [id]: { ...state.notes[id], content },
      },
    })),

  addNote: () =>
    set((state) => {
      const id = `note-${Date.now()}`
      return {
        items: [
          ...state.items,
          { id, type: 'note', title: 'workspace.new_note', x: 700, y: 470 },
        ],
        notes: {
          ...state.notes,
          [id]: { id, title: 'workspace.new_note', content: 'workspace.new_note_content', color: 'yellow' },
        },
        selectedItemId: id,
        canvasView: 'workspace',
      }
    }),

  removeItem: (id) =>
    set((state) => {
      const { [id]: _removedNote, ...notes } = state.notes
      const { [id]: _removedPlan, ...coursePlans } = state.coursePlans
      return {
        items: state.items.filter((item) => item.id !== id),
        notes,
        coursePlans,
        selectedItemId: state.selectedItemId === id ? null : state.selectedItemId,
        currentCourseId: state.currentCourseId === id ? null : state.currentCourseId,
        canvasView: state.currentCourseId === id ? 'workspace' : state.canvasView,
      }
    }),

  setZoom: (zoom) => set({ zoom: Math.min(120, Math.max(80, zoom)) }),

  beginCoursePlanGeneration: () =>
    set((state) => {
      // const current = state.coursePlans[fastApiPlan.id]
      // const generatingPlan: CoursePlan = {
      //   ...(current ?? fastApiPlan),
      //   status: 'generating',
      // }
      // const hasItem = state.items.some((item) => item.id === fastApiPlan.id)
      return {
        ...state
        //   items: hasItem
        //     ? state.items
        //     : [
        //       ...state.items,
        //       {
        //         id: fastApiPlan.id,
        //         type: 'course-plan',
        //         title: fastApiPlan.title,
        //         x: 42,
        //         y: 78,
        //       },
        //     ],
        //   coursePlans: { ...state.coursePlans, [fastApiPlan.id]: generatingPlan },
        //   selectedItemId: fastApiPlan.id,
      }
    }),

  completeCoursePlanGeneration: () =>
    set((state) => ({
      coursePlans: {
        ...state.coursePlans,
        // [fastApiPlan.id]: { ...state.coursePlans[fastApiPlan.id], status: 'ready' },
      },
    })),

  setCoursePlan: (course) =>
    set((state) => {
      const hasItem = state.items.some((item) => item.id === course.id)
      return {
        items: hasItem
          ? state.items.map((item) => item.id === course.id
            ? { ...item, type: 'course-plan', title: course.title }
            : item)
          : [
            ...state.items,
            { id: course.id, type: 'course-plan', title: course.title, x: 42, y: 78 },
          ],
        coursePlans: { ...state.coursePlans, [course.id]: course },
        selectedItemId: course.id,
      }
    }),

  loadNodes: (nodes) =>
    set(() => {
      const items = nodes.map((node) => ({
        id: String(node.id),
        type: node.type === 'course' ? 'course-plan' as const : node.type,
        title: node.title,
        x: node.position?.x ?? 42,
        y: node.position?.y ?? 78,
      }))
      const coursePlans: Record<string, CoursePlan> = {}
      const notes: Record<string, WorkspaceNote> = {}
      for (const node of nodes) {
        const id = String(node.id)
        if (node.type === 'course') {
          coursePlans[id] = {
            ...(node.content as Partial<CoursePlan>),
            id,
            title: node.title,
            chapters: Array.isArray(node.content.chapters) ? node.content.chapters as CoursePlan['chapters'] : [],
            status: node.content.status === 'generating' || node.content.status === 'error' ? node.content.status : 'ready',
          }
        }
        if (node.type === 'note') {
          notes[id] = {
            id,
            title: node.title,
            content: typeof node.content.content === 'string' ? node.content.content : '',
            color: node.content.color === 'blue' || node.content.color === 'pink' ? node.content.color : 'yellow',
          }
        }
      }
      return {
        nodes,
        items,
        coursePlans,
        notes,
        selectedItemId: items[0]?.id ?? '',
        currentCourseId: null,
        canvasView: 'workspace',
      }
    }),

  upsertNode: (node) =>
    set((state) => {
      const nodes = [...state.nodes.filter((item) => item.id !== node.id), node]
      const items = nodes.map((item) => ({
        id: String(item.id),
        type: item.type === 'course' ? 'course-plan' as const : item.type,
        title: item.title,
        x: item.position?.x ?? 42,
        y: item.position?.y ?? 78,
      }))
      const id = String(node.id)
      const coursePlans = { ...state.coursePlans }
      const notes = { ...state.notes }
      if (node.type === 'course') {
        coursePlans[id] = {
          ...(node.content as Partial<CoursePlan>),
          id,
          title: node.title,
          chapters: Array.isArray(node.content.chapters) ? node.content.chapters as CoursePlan['chapters'] : [],
          status: node.content.status === 'generating' || node.content.status === 'error' ? node.content.status : 'ready',
        }
      }
      if (node.type === 'note') {
        notes[id] = {
          id,
          title: node.title,
          content: typeof node.content.content === 'string' ? node.content.content : '',
          color: node.content.color === 'blue' || node.content.color === 'pink' ? node.content.color : 'yellow',
        }
      }
      return { nodes, items, coursePlans, notes }
    }),
}))
