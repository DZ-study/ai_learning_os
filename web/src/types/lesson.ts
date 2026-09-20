export type LessonBlockType =
  | 'text'
  | 'image'
  | 'code'
  | 'video'
  | 'quiz'
  | 'exercise'

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
  id: string
  type: LessonBlockType
  title: string
  data: LessonBlockData
}

export interface LessonContent {
  id: string
  lessonId: string
  title: string
  blocks: LessonBlock[]
}
