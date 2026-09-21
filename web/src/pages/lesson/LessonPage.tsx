import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'

import { generateLessonContent, getLessonContent } from '@/services/lesson'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import type { LessonBlock, LessonContent } from '@/types/lesson'

import LearningHeader from './LearningHeader'
import LessonBlockSidebar from './LessonBlockSidebar'
import LessonContentViewer from './LessonContentViewer'

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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const currentLessonId = useWorkspaceStore((state) => state.currentLessonId)
  const currentBlockId = useWorkspaceStore((state) => state.currentBlockId)
  const lessonProgress = useWorkspaceStore((state) => state.lessonProgress)
  const setCurrentLesson = useWorkspaceStore((state) => state.setCurrentLesson)
  const setCurrentBlock = useWorkspaceStore((state) => state.setCurrentBlock)
  const completeBlock = useWorkspaceStore((state) => state.completeBlock)

  const blocks = useMemo<LessonBlock[]>(
    () => (content?.blocks ?? []).map((block, index) => ({
      ...block,
      id: block.id || `${content?.lessonId}-${block.order || index + 1}`,
      order: block.order || index + 1,
    })),
    [content],
  )
  const currentLessonKey = lessonId ? String(lessonId) : null
  const completedBlockIds = currentLessonKey
    ? lessonProgress[currentLessonKey] ?? []
    : []

  useEffect(() => {
    if (currentLessonKey && currentLessonId !== currentLessonKey) {
      setCurrentLesson(currentLessonKey)
      setCurrentBlock(blocks[0]?.id ?? null)
    }
  }, [currentLessonId, currentLessonKey, blocks, setCurrentLesson, setCurrentBlock])

  useEffect(() => {
    let cancelled = false
    if (!lessonId) {
      setLoading(false)
      setError('未找到要学习的 Lesson')
      return () => { cancelled = true }
    }

    setLoading(true)
    setError(null)
    void getLessonContent(lessonId)
      .then(async ({ data }) => {
        if (cancelled) return
        if ('blocks' in data) {
          setContent(data)
          return
        }
        const generated = await generateLessonContent(lessonId)
        if (!cancelled) setContent(generated.data)
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
    blocks.findIndex((block) => block.id === currentBlockId),
  )
  const currentBlock = blocks[currentIndex] ?? blocks[0]

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">正在准备学习内容…</div>
  }

  if (error || !content || !currentBlock || !lessonMeta) {
    return <div className="flex h-screen items-center justify-center text-sm text-destructive">{error ?? '暂无学习内容'}</div>
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <LearningHeader
        courseName="学习课程"
        chapterName="当前章节"
        lessonTitle={content.title || lessonMeta.title}
        completedBlocks={completedBlockIds.length}
        totalBlocks={blocks.length}
      />

      <div className="flex min-h-0 flex-1">
        <LessonBlockSidebar
          blocks={blocks}
          currentBlockId={currentBlock.id || null}
          completedBlockIds={completedBlockIds}
          onSelectBlock={setCurrentBlock}
        />

        <LessonContentViewer
          block={currentBlock}
          blockIndex={currentIndex}
          totalBlocks={blocks.length}
          completed={completedBlockIds.includes(currentBlock.id!)}
          onComplete={() => completeBlock(String(lessonId), currentBlock.id!)}
          onPrev={() => setCurrentBlock(blocks[currentIndex - 1]?.id ?? null)}
          onNext={() => setCurrentBlock(blocks[currentIndex + 1]?.id ?? null)}
        />
      </div>
    </div>
  )
}

export default LessonPage
