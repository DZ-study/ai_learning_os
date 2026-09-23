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
  entity_type?: 'goal_plan' | 'goal_item' | 'learning_task' | null
  entity_id?: number | null
  course_plan?: CoursePlan | null
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
  id: number
  title: string
  estimatedMinutes?: number
  status?: LessonStatus
  progress: number
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
