export type WorkspaceItemType =
  | 'course-plan'
  | 'course'
  | 'document'
  | 'note'
  | 'image'
  | 'whiteboard'

export type SpaceNodeType = 'course' | 'note' | 'document'

export interface SpaceNode {
  id: number
  goal_id: number
  user_id: number
  type: SpaceNodeType
  title: string
  content: Record<string, unknown>
  position: WorkspaceItemPosition
}

export type CoursePlanStatus = 'generating' | 'ready' | 'error'

export type LessonStatus = 'locked' | 'available' | 'completed'

export interface WorkspaceItemPosition {
  x: number
  y: number
}

export interface WorkspaceItem {
  id: string
  type: WorkspaceItemType
  title: string
  x: number
  y: number
}

export interface Lesson {
  id: string
  title: string
  estimatedMinutes?: number
  status?: LessonStatus
}

export interface Chapter {
  id: string
  title: string
  lessons: Lesson[]
}

export interface CoursePlan {
  id: string
  title: string
  description?: string
  chapters: Chapter[]
  status: CoursePlanStatus
}

export interface WorkspaceNote {
  id: string
  title: string
  content: string
  color: 'yellow' | 'blue' | 'pink'
}
