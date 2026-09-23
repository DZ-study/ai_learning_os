import { ArrowLeft, BookOpen, Check, Clock3, Timer } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { CoursePlan, Lesson } from '@/types/workspace'

interface CourseDetailProps {
  course: CoursePlan
  onBack: () => void
  onStartLesson: (lesson: Lesson) => void
}

function LessonProgressRing({ progress }: { progress: number }) {
  const normalizedProgress = Math.min(100, Math.max(0, progress))
  const radius = 6
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - normalizedProgress / 100)

  return (
    <span
      className="relative flex size-4 shrink-0 items-center justify-center"
      aria-label={`学习进度 ${normalizedProgress}%`}
    >
      <svg viewBox="0 0 16 16" className="size-4 -rotate-90" aria-hidden="true">
        <circle
          cx="8"
          cy="8"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-[#d8d5d8]"
        />
        {normalizedProgress > 0 && (
          <circle
            cx="8"
            cy="8"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="text-[#6bb590]"
          />
        )}
      </svg>
      {normalizedProgress === 100 && (
        <Check className="absolute size-2.5 text-[#6bb590]" strokeWidth={3} />
      )}
    </span>
  )
}

export default function CourseDetail({ course, onBack, onStartLesson }: CourseDetailProps) {
  const { t } = useTranslation()
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const completedLessons = course.chapters.reduce(
    (count, chapter) => count + chapter.lessons.filter((lesson) => lesson.progress === 100).length,
    0,
  )
  const lessonCount = course.chapters.reduce((count, chapter) => count + chapter.lessons.length, 0)

  return (
    <section className="h-full overflow-auto bg-[#fbfaf9]" aria-label={t('workspace.course_detail')}>
      <div className="mx-auto max-w-4xl px-8 py-8 md:px-12">
        <button onClick={onBack} className="mb-8 flex items-center gap-2 text-sm text-[#77747a] transition-colors hover:text-[#6655b3]">
          <ArrowLeft className="size-4" />
          {t('workspace.back_to_workspace')}
        </button>

        <div className="rounded-2xl bg-[#28314e] p-8 text-white shadow-sm md:p-10">
          <div className="mb-7 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-white/65">
            <BookOpen className="size-4" />
            {t('workspace.course_detail')}
          </div>
          <h1 className="max-w-2xl font-serif text-4xl leading-tight tracking-[-0.04em] md:text-5xl">
            {t(course.title, { defaultValue: course.title })}
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-white/75">
            {t('course.description', { defaultValue: course.description || t('workspace.course_detail_description') })}
          </p>
          <div className="mt-8 flex flex-wrap gap-6 text-xs text-white/70">
            <span>{t('workspace.chapter_count', { count: course.chapters.length })}</span>
            <span>{lessonCount} {t('workspace.lessons')}</span>
            <span>{completedLessons}/{lessonCount || 0} {t('workspace.completed')}</span>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <h2 className="font-serif text-2xl tracking-[-0.03em] text-[#343a4d]">{t('workspace.course_sections')}</h2>
          <span className="text-xs text-[#99959b]">{course.chapters.length} {t('workspace.chapters')}</span>
        </div>

        <div className="mt-4 space-y-3">
          {course.chapters.map((chapter, index) => (
            <article key={chapter.id} className="rounded-xl border border-[#eeeae7] bg-white p-5 shadow-[0_2px_12px_rgba(55,47,75,0.03)]">
              <div className="flex items-start gap-4">
                <span className="flex -mt-1 size-8 shrink-0 items-center justify-center rounded-full bg-[#eeebff] text-sm font-semibold text-[#6655b3]">{index + 1}</span>
                <div className="min-w-0 flex-1 bg-[#fbfaf9]">
                  <h3 className="font-medium text-[#454451]">{t(chapter.title, { defaultValue: chapter.title })}</h3>
                  <div className="mt-3">
                    {chapter.lessons.map((lesson) => (
                      <div key={lesson.id} className="flex py-2 items-center justify-between gap-2 text-sm text-[#77747a]">
                        <div className="flex items-center gap-2 transition-colors hover:text-[#6655b3]">
                          <LessonProgressRing progress={lesson.progress} />
                          <button
                            type="button"
                            className="truncate text-left hover:text-[#6655b3] cursor-pointer"
                            onClick={() => setSelectedLesson(lesson)}
                          >
                            {t(lesson.title, { defaultValue: lesson.title })}
                          </button>
                        </div>
                        {lesson.estimatedMinutes && <div className="flex items-center gap-1">
                          <Timer className="w-[20px]" />
                          <span className="text-[12px] mt-[4px]">{lesson.estimatedMinutes} mins</span>
                        </div>}
                      </div>
                    ))}
                  </div>
                </div>
                <Clock3 className="mt-1 size-4 shrink-0 text-[#aaa5a5]" />
              </div>
            </article>
          ))}
        </div>
      </div>

      <Dialog
        open={selectedLesson !== null}
        onOpenChange={(open) => { if (!open) setSelectedLesson(null) }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>开始学习</DialogTitle>
            <DialogDescription>
              确认现在开始学习“{selectedLesson ? t(selectedLesson.title, { defaultValue: selectedLesson.title }) : ''}”节内容吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedLesson(null)}>取消</Button>
            <Button
              onClick={() => {
                if (!selectedLesson) return
                const lesson = selectedLesson
                setSelectedLesson(null)
                onStartLesson(lesson)
              }}
            >
              确认开始
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
