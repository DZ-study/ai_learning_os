import type {
  LessonBlock,
  LessonContent,
  LessonContentNotGenerated,
  LessonProgress,
} from '@/types/lesson'
import type { AxiosResponse } from 'axios'

import req from './request'

export type LessonContentResult = LessonContent | LessonContentNotGenerated

type ApiLessonBlock = Omit<LessonBlock, 'blockId'> & { block_id: string }
type ApiLessonContent = Omit<LessonContent, 'lessonId' | 'blocks'> & {
  lesson_id: number
  blocks: ApiLessonBlock[]
}

interface ApiLessonProgress {
  lesson_id: number
  status: LessonProgress['status']
  started_at: string | null
  completed_at: string | null
  last_accessed_at: string | null
  total_required_blocks: number
  completed_required_blocks: number
  progress_percent: number
  completed_block_ids: string[]
}

function normalizeContent(data: ApiLessonContent): LessonContent {
  return {
    ...data,
    lessonId: data.lesson_id,
    blocks: data.blocks.map(({ block_id, ...block }) => ({
      ...block,
      blockId: block_id,
    })),
  }
}

function normalizeProgress(data: ApiLessonProgress): LessonProgress {
  return {
    lessonId: data.lesson_id,
    status: data.status,
    startedAt: data.started_at,
    completedAt: data.completed_at,
    lastAccessedAt: data.last_accessed_at,
    totalRequiredBlocks: data.total_required_blocks,
    completedRequiredBlocks: data.completed_required_blocks,
    progressPercent: data.progress_percent,
    completedBlockIds: data.completed_block_ids,
  }
}

export const getLessonContent = async (
  lessonId: number,
): Promise<AxiosResponse<LessonContentResult>> => {
  const response = await req.get<LessonContentNotGenerated | ApiLessonContent>(
    `/lessons/${lessonId}/content`,
  )
  if ('blocks' in response.data) {
    return { ...response, data: normalizeContent(response.data as ApiLessonContent) }
  }
  return response as AxiosResponse<LessonContentResult>
}

export const generateLessonContent = (lessonId: number) =>
  req.post<ApiLessonContent>(`/lessons/${lessonId}/generate-content`).then((response) => ({
    ...response,
    data: normalizeContent(response.data),
  }))

export const startLesson = (lessonId: number) =>
  req.post<ApiLessonProgress>(`/lessons/${lessonId}/start`).then((response) => ({
    ...response,
    data: normalizeProgress(response.data),
  }))

export const getLessonProgress = (lessonId: number) =>
  req.get<ApiLessonProgress>(`/lessons/${lessonId}/progress`).then((response) => ({
    ...response,
    data: normalizeProgress(response.data),
  }))

export const completeLessonBlock = (lessonId: number, blockId: string) =>
  req.post<ApiLessonProgress>(
    `/lessons/${lessonId}/blocks/${encodeURIComponent(blockId)}/complete`,
  ).then((response) => ({
    ...response,
    data: normalizeProgress(response.data),
  }))
