import { useEffect } from 'react'

import { useWorkspaceStore } from '@/stores/workspaceStore'

import LearningHeader from './LearningHeader'
import LessonBlockSidebar from './LessonBlockSidebar'
import LessonContentViewer from './LessonContentViewer'
import { mockLessonContent, mockLessonMeta } from './mockLesson'

const LessonPage = () => {
  const currentLessonId = useWorkspaceStore((state) => state.currentLessonId)
  const currentBlockId = useWorkspaceStore((state) => state.currentBlockId)
  const lessonProgress = useWorkspaceStore((state) => state.lessonProgress)
  const setCurrentLesson = useWorkspaceStore((state) => state.setCurrentLesson)
  const setCurrentBlock = useWorkspaceStore((state) => state.setCurrentBlock)
  const completeBlock = useWorkspaceStore((state) => state.completeBlock)

  const lesson = mockLessonContent
  const blocks = lesson.blocks
  const completedBlockIds = lessonProgress[lesson.lessonId] ?? []

  useEffect(() => {
    if (currentLessonId !== lesson.lessonId) {
      setCurrentLesson(lesson.lessonId)
      setCurrentBlock(blocks[0]?.id ?? null)
    }
  }, [currentLessonId, lesson.lessonId, blocks, setCurrentLesson, setCurrentBlock])

  const currentIndex = Math.max(
    0,
    blocks.findIndex((block) => block.id === currentBlockId),
  )
  const currentBlock = blocks[currentIndex] ?? blocks[0]

  if (!currentBlock) {
    return null
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <LearningHeader
        courseName={mockLessonMeta.courseName}
        chapterName={mockLessonMeta.chapterName}
        lessonTitle={lesson.title}
        completedBlocks={completedBlockIds.length}
        totalBlocks={blocks.length}
      />

      <div className="flex min-h-0 flex-1">
        <LessonBlockSidebar
          blocks={blocks}
          currentBlockId={currentBlock.id}
          completedBlockIds={completedBlockIds}
          onSelectBlock={setCurrentBlock}
        />

        <LessonContentViewer
          block={currentBlock}
          blockIndex={currentIndex}
          totalBlocks={blocks.length}
          completed={completedBlockIds.includes(currentBlock.id)}
          onComplete={() => completeBlock(lesson.lessonId, currentBlock.id)}
          onPrev={() => setCurrentBlock(blocks[currentIndex - 1]?.id ?? null)}
          onNext={() => setCurrentBlock(blocks[currentIndex + 1]?.id ?? null)}
        />
      </div>
    </div>
  )
}

export default LessonPage
