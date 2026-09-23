import { useEffect, useMemo, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  completeLessonBlock,
  generateLessonContent,
  getLessonContent,
  getLessonProgress,
  startLesson,
} from '@/services/lesson'
import { goalKeys, lessonKeys, progressKeys, spaceNodeKeys } from '@/query/keys'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import type { LessonBlock } from '@/types/lesson'

import LearningHeader from './LearningHeader'
import LessonBlockSidebar from './LessonBlockSidebar'
import LessonContentViewer from './LessonContentViewer'
import LessonTutor from './LessonTutor'

interface LessonRouteState {
  goalId?: number
  lesson?: {
    id: number
    title: string
    estimatedMinutes?: number
  }
}

const LessonPage = () => {
  const location = useLocation()
  const routeState = location.state as LessonRouteState | null
  const lessonMeta = routeState?.lesson
  const lessonId = lessonMeta?.id
  const goalId = routeState?.goalId
  const queryClient = useQueryClient()
  const contentQuery = useQuery({
    queryKey: lessonKeys.content(lessonId ?? 0),
    queryFn: async () => (await getLessonContent(lessonId!)).data,
    enabled: Boolean(lessonId),
  })
  const progressQuery = useQuery({
    queryKey: progressKeys.lesson(lessonId ?? 0),
    queryFn: async () => (await getLessonProgress(lessonId!)).data,
    enabled: Boolean(lessonId),
  })
  const {
    mutate: generateContent,
    isPending: isGeneratingContent,
    error: generateContentError,
  } = useMutation({
    mutationFn: (id: number) => generateLessonContent(id),
    onSuccess: (response, id) => {
      queryClient.setQueryData(lessonKeys.content(id), response.data)
    },
  })
  const {
    mutate: startLessonRequest,
    isPending: isStartingLesson,
    error: startLessonError,
  } = useMutation({
    mutationFn: (id: number) => startLesson(id),
    onSuccess: (response, id) => {
      queryClient.setQueryData(progressKeys.lesson(id), response.data)
    },
  })
  const {
    mutate: completeBlock,
    error: completeBlockError,
  } = useMutation({
    mutationFn: ({ id, blockId }: { id: number; blockId: string }) =>
      completeLessonBlock(id, blockId),
    onSuccess: (response, variables) => {
      queryClient.setQueryData(progressKeys.lesson(variables.id), response.data)
      if (goalId) {
        void queryClient.invalidateQueries({ queryKey: goalKeys.detail(goalId) })
        void queryClient.invalidateQueries({ queryKey: spaceNodeKeys.list(goalId) })
      }
    },
  })
  const startedLessonRef = useRef<number | null>(null)
  const generatedLessonRef = useRef<number | null>(null)
  const currentLessonId = useWorkspaceStore((state) => state.currentLessonId)
  const currentBlockId = useWorkspaceStore((state) => state.currentBlockId)
  const setCurrentLesson = useWorkspaceStore((state) => state.setCurrentLesson)
  const setCurrentBlock = useWorkspaceStore((state) => state.setCurrentBlock)

  const content = contentQuery.data && 'blocks' in contentQuery.data
    ? contentQuery.data
    : null
  const progress = progressQuery.data ?? null
  const blocks = useMemo<LessonBlock[]>(
    () => (content?.blocks ?? []).map((block, index) => ({
      ...block,
      order: block.order || index + 1,
    })),
    [content],
  )
  const currentLessonKey = lessonId ? String(lessonId) : null
  const completedBlockIds = progress?.completedBlockIds ?? []
  const needsContentGeneration = Boolean(
    contentQuery.data && !('blocks' in contentQuery.data),
  )

  useEffect(() => {
    if (
      !lessonId
      || !contentQuery.data
      || 'blocks' in contentQuery.data
      || isGeneratingContent
      || generatedLessonRef.current === lessonId
    ) return

    generatedLessonRef.current = lessonId
    generateContent(lessonId)
  }, [contentQuery.data, generateContent, isGeneratingContent, lessonId])

  useEffect(() => {
    if (!lessonId || startedLessonRef.current === lessonId) return
    startedLessonRef.current = lessonId
    startLessonRequest(lessonId)
  }, [lessonId, startLessonRequest])

  useEffect(() => {
    if (!currentLessonKey) return
    if (currentLessonId !== currentLessonKey) {
      setCurrentLesson(currentLessonKey)
    }
    if (blocks.length && !blocks.some((block) => block.blockId === currentBlockId)) {
      setCurrentBlock(blocks[0].blockId)
    }
  }, [currentBlockId, currentLessonId, currentLessonKey, blocks, setCurrentLesson, setCurrentBlock])

  const currentIndex = Math.max(
    0,
    blocks.findIndex((block) => block.blockId === currentBlockId),
  )
  const currentBlock = blocks[currentIndex] ?? blocks[0]

  const handleCompleteBlock = async () => {
    if (!lessonId || !currentBlock) return
    completeBlock({ id: lessonId, blockId: currentBlock.blockId })
  }

  const isLoading = contentQuery.isLoading || progressQuery.isLoading
    || isGeneratingContent
    || isStartingLesson
    || (needsContentGeneration && !generateContentError)
  const requestError = contentQuery.error || progressQuery.error
    || generateContentError || startLessonError || completeBlockError
  const errorMessage = requestError instanceof Error
    ? requestError.message
    : requestError
      ? '学习内容加载失败，请稍后重试'
      : null

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">正在准备学习内容…</div>
  }

  if (errorMessage || !content || !currentBlock || !lessonMeta) {
    return <div className="flex h-screen items-center justify-center text-sm text-destructive">{errorMessage ?? (lessonMeta ? '暂无学习内容' : '未找到要学习的 Lesson')}</div>
  }

  return (
    <div className="relative flex h-screen flex-col bg-background">
      <LearningHeader
        courseName="学习课程"
        chapterName="当前章节"
        lessonTitle={content.title || lessonMeta.title}
        completedBlocks={progress?.completedRequiredBlocks ?? 0}
        totalBlocks={progress?.totalRequiredBlocks ?? 0}
        progressPercent={progress?.progressPercent ?? 0}
        status={progress?.status ?? 'not_started'}
      />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <LessonBlockSidebar
          blocks={blocks}
          currentBlockId={currentBlock.blockId}
          completedBlockIds={completedBlockIds}
          onSelectBlock={setCurrentBlock}
        />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <LessonContentViewer
            block={currentBlock}
            blockIndex={currentIndex}
            totalBlocks={blocks.length}
            completed={completedBlockIds.includes(currentBlock.blockId)}
            onComplete={() => { void handleCompleteBlock() }}
            onPrev={() => setCurrentBlock(blocks[currentIndex - 1]?.blockId ?? null)}
            onNext={() => setCurrentBlock(blocks[currentIndex + 1]?.blockId ?? null)}
          />
          <LessonTutor
            lessonId={lessonMeta.id}
            currentBlockId={currentBlock.blockId}
          />
        </div>
      </div>
    </div>
  )
}

export default LessonPage
