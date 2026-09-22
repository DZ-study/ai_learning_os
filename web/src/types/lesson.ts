export type LessonBlockType =
  | 'explanation'
  | 'example'
  | 'code'
  | 'question'
  | 'quiz'
  | 'summary'

export interface TextBlockData {
  markdown: string
}

export interface CodeBlockData {
  language: string
  code: string
}

export interface QuizBlockData {
  question: string
  options: string[]
  answer: string
}

export type LessonBlockData =
  | TextBlockData
  | CodeBlockData
  | QuizBlockData
  | Record<string, unknown>

export interface LessonBlock {
  blockId: string
  type: LessonBlockType
  title: string
  content: LessonBlockData
  order: number
  required: boolean
}

export interface LessonContent {
  id: number
  lessonId: number
  title: string
  blocks: LessonBlock[]
}

export interface LessonContentNotGenerated {
  status: 'not_generated'
  content: null
}

export type LessonLearningStatus = 'not_started' | 'in_progress' | 'completed'

export interface LessonProgress {
  lessonId: number
  status: LessonLearningStatus
  startedAt: string | null
  completedAt: string | null
  lastAccessedAt: string | null
  totalRequiredBlocks: number
  completedRequiredBlocks: number
  progressPercent: number
  completedBlockIds: string[]
}
