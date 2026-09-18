import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Check, ChevronDown, ChevronRight, Circle, Ellipsis, LoaderCircle, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { CoursePlan } from '@/types/workspace'

interface CourseCardProps {
  course: CoursePlan
  selected: boolean
  onSelect: () => void
  onOpen: () => void
  onDelete: () => void
  onRetry: () => void
}

export default function CoursePlanCard({ course, selected, onSelect, onOpen, onDelete, onRetry }: CourseCardProps) {
  const [expanded, setExpanded] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const { t } = useTranslation()

  return (
    <article
      className={cn('course-card group', selected && 'course-card-selected')}
      onClick={onSelect}
      onDoubleClick={onOpen}
      aria-label={t(course.title, { defaultValue: course.title }) + " " + t("workspace.course_plan")}
    >
      <div className="course-cover">
        <div className="absolute inset-0 opacity-80" style={{ backgroundImage: 'linear-gradient(135deg, rgba(255,214,150,.12), transparent 45%), radial-gradient(circle at 84% 20%, rgba(255,244,180,.3) 0 3px, transparent 4px), radial-gradient(circle at 20% 65%, rgba(255,238,184,.2) 0 22px, transparent 23px)' }} />
        <div className="relative flex items-start justify-between">
          <span className="rounded-md bg-white/15 px-2 py-1 text-[10px] font-medium tracking-[0.14em] text-white/90">COURSE PLAN</span>
          <div className="relative">
            <Button
              variant="ghost"
              size="icon-xs"
              className="text-white/80 hover:bg-white/15 hover:text-white"
              onClick={(event) => {
                event.stopPropagation()
                setMenuOpen((open) => !open)
              }}
              aria-label={t("workspace.course_actions")}
            >
              <Ellipsis className="size-4" />
            </Button>
            {menuOpen && (
              <div className="absolute right-0 top-8 z-20 w-28 rounded-lg border border-white/20 bg-[#372f4b] p-1 text-xs text-white shadow-xl">
                <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-white/10" onClick={(event) => event.stopPropagation()}>
                  <Pencil className="size-3" /> {t("common.edit")}
                </button>
                <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-red-200 hover:bg-white/10" onClick={(event) => { event.stopPropagation(); onDelete() }}>
                  <Trash2 className="size-3" /> {t("common.delete")}
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="relative mt-6 flex items-end justify-between">
          <h2 className="max-w-[220px] font-serif text-[21px] leading-[1.05] tracking-[-0.03em] text-white">{t(course.title, { defaultValue: course.title })}</h2>
          <div className="book-mark" aria-hidden="true">✦</div>
        </div>
      </div>

      <div className="p-4">
        {course.status === 'generating' ? (
          <div className="space-y-3 py-2">
            <div className="flex items-center gap-2 text-sm font-medium text-[#3d4960]">
              <LoaderCircle className="size-4 animate-spin text-[#8c73e8]" /> {t("workspace.course_generating")}
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[#eeeaf8]">
              <div className="h-full w-[62%] animate-pulse rounded-full bg-[#8c73e8]" />
            </div>
            <p className="text-[11px] leading-5 text-[#99969b]">{t("workspace.course_generating_hint")}</p>
          </div>
        ) : course.status === 'error' ? (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{t("workspace.course_failed")}<button className="ml-2 underline" onClick={(event) => { event.stopPropagation(); onRetry() }}>{t("common.retry")}</button></div>
        ) : (
          <>
            <p className="text-[12px] leading-5 text-[#727078]">{t("course.description", { defaultValue: course.description })}</p>
            <div className="my-4 h-px bg-[#eeeae7]" />
            <button
              className="flex w-full items-center justify-between text-left"
              onClick={(event) => {
                event.stopPropagation()
                setExpanded((open) => !open)
              }}
            >
              <span className="flex items-center gap-2 text-[12px] font-semibold text-[#343a4d]">
                {expanded ? <ChevronDown className="size-3.5 text-[#8d78df]" /> : <ChevronRight className="size-3.5 text-[#8d78df]" />}
                {t("workspace.course_sections")}
              </span>
              <span className="text-[11px] text-[#a4a0a5]">{t("workspace.chapter_count", { count: course.chapters.length })}</span>
            </button>
            {expanded && (
              <div className="mt-3 space-y-3">
                {course.chapters.map((chapter, index) => (
                  <div key={chapter.id} className="chapter-row">
                    <div className="flex items-start gap-2">
                      <span className={cn('mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full text-[9px]', index === 0 ? 'bg-[#ece7ff] text-[#7f68dc]' : 'bg-[#f3f1f0] text-[#99959b]')}>
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12px] font-medium text-[#454451]">{t(chapter.title, { defaultValue: chapter.title })}</p>
                        {index === 0 && (
                          <div className="mt-1.5 space-y-1 border-l border-[#e4ddff] pl-3">
                            {chapter.lessons.map((lesson) => (
                              <div key={lesson.id} className="flex items-center gap-1.5 text-[10px] text-[#929099]">
                                {lesson.status === 'completed' ? <Check className="size-3 text-[#6bb590]" /> : <Circle className="size-2.5 text-[#b8b3bb]" />}
                                <span className="min-w-0 truncate">{t(lesson.title, { defaultValue: lesson.title })}</span>
                                {lesson.estimatedMinutes ? <span className="shrink-0">{lesson.estimatedMinutes}m</span> : null}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="shrink-0 text-[10px] text-[#aaa6aa]">{chapter.lessons.length}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      <footer className="flex items-center justify-between border-t border-[#eeeae7] px-4 py-2.5 text-[10px] text-[#9b979c]">
        <span>{course.status === 'generating' ? t("workspace.generating") : t("workspace.ready")} · AI workspace</span>
        <span>•••</span>
      </footer>
    </article>
  )
}
