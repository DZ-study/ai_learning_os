import type { LessonContent, LessonContentNotGenerated } from '@/types/lesson'
import type { AxiosResponse } from 'axios'

import req from './request'

export type LessonContentResult = LessonContent | LessonContentNotGenerated

type ApiLessonContent = Omit<LessonContent, 'lessonId'> & { lesson_id: number }

function normalizeContent(data: ApiLessonContent): LessonContent {
  return {
    ...data,
    lessonId: data.lesson_id,
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
