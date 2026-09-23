import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'

import {
  completeLessonBlock,
  generateLessonContent,
  getLessonContent,
  startLesson,
} from '@/services/lesson'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import type { LessonBlock, LessonContent, LessonProgress } from '@/types/lesson'

import LearningHeader from './LearningHeader'
import LessonBlockSidebar from './LessonBlockSidebar'
import LessonContentViewer from './LessonContentViewer'
import LessonTutor from './LessonTutor'

interface LessonRouteState {
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
  const [content, setContent] = useState<LessonContent | null>(null)
  const [progress, setProgress] = useState<LessonProgress | null>(null)
  const [loading, setLoading] = useState(Boolean(lessonId))
  const [error, setError] = useState<string | null>(null)
  const currentLessonId = useWorkspaceStore((state) => state.currentLessonId)
  const currentBlockId = useWorkspaceStore((state) => state.currentBlockId)
  const setCurrentLesson = useWorkspaceStore((state) => state.setCurrentLesson)
  const setCurrentBlock = useWorkspaceStore((state) => state.setCurrentBlock)

  const blocks = useMemo<LessonBlock[]>(
    () => (content?.blocks ?? []).map((block, index) => ({
      ...block,
      order: block.order || index + 1,
    })),
    [content],
  )
  const currentLessonKey = lessonId ? String(lessonId) : null
  const completedBlockIds = progress?.completedBlockIds ?? []

  useEffect(() => {
    if (!currentLessonKey) return
    if (currentLessonId !== currentLessonKey) {
      setCurrentLesson(currentLessonKey)
    }
    if (blocks.length && !blocks.some((block) => block.blockId === currentBlockId)) {
      setCurrentBlock(blocks[0].blockId)
    }
  }, [currentBlockId, currentLessonId, currentLessonKey, blocks, setCurrentLesson, setCurrentBlock])

  useEffect(() => {
    let cancelled = false
    if (!lessonId) {
      return () => { cancelled = true }
    }

    void getLessonContent(lessonId)
      .then(async ({ data }) => {
        if (cancelled) return
        const lessonContent = 'blocks' in data
          ? data
          : (await generateLessonContent(lessonId)).data
        const lessonProgress = await startLesson(lessonId)
        if (!cancelled) {
          setContent(lessonContent)
          setProgress(lessonProgress.data)
        }
      })
      .catch(() => {
        if (!cancelled) setError('学习内容加载失败，请稍后重试')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [lessonId])

  const currentIndex = Math.max(
    0,
    blocks.findIndex((block) => block.blockId === currentBlockId),
  )
  const currentBlock = blocks[currentIndex] ?? blocks[0]

  const handleCompleteBlock = async () => {
    if (!lessonId || !currentBlock) return
    try {
      const { data } = await completeLessonBlock(lessonId, currentBlock.blockId)
      setProgress(data)
    } catch {
      setError('学习进度保存失败，请稍后重试')
    }
  }

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">正在准备学习内容…</div>
  }

  if (error || !content || !currentBlock || !lessonMeta) {
    return <div className="flex h-screen items-center justify-center text-sm text-destructive">{error ?? (lessonMeta ? '暂无学习内容' : '未找到要学习的 Lesson')}</div>
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
