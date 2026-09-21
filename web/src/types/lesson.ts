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
  id?: string
  type: LessonBlockType
  title: string
  content: LessonBlockData
  order: number
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
