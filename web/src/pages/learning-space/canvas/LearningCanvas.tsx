import { useWorkspaceStore } from '@/stores/workspaceStore'
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useGoalStore } from '@/stores/goalStore'

import CoursePlanCard from './CourseCard'
import DraggableItem from './DraggableItem'
import NoteCard from './NoteCard'
import CourseDetail from './CourseDetail'

export default function LearningCanvas() {
  const items = useWorkspaceStore((state) => state.items)
  const coursePlans = useWorkspaceStore((state) => state.coursePlans)
  const notes = useWorkspaceStore((state) => state.notes)
  const selectedItemId = useWorkspaceStore((state) => state.selectedItemId)
  const currentCourseId = useWorkspaceStore((state) => state.currentCourseId)
  const canvasView = useWorkspaceStore((state) => state.canvasView)
  const selectItem = useWorkspaceStore((state) => state.selectItem)
  const openCourseDetail = useWorkspaceStore((state) => state.openCourseDetail)
  const setCanvasView = useWorkspaceStore((state) => state.setCanvasView)
  const updateNote = useWorkspaceStore((state) => state.updateNote)
  const removeItem = useWorkspaceStore((state) => state.removeItem)
  const updateItemPosition = useWorkspaceStore((state) => state.updateItemPosition)
  const beginCoursePlanGeneration = useWorkspaceStore((state) => state.beginCoursePlanGeneration)
  const goal = useGoalStore((state) => state.currentGoal)
  const navigate = useNavigate()
  const { t } = useTranslation()
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const itemId = String(event.active.id)
    const item = items.find((candidate) => candidate.id === itemId)

    if (!item || (event.delta.x === 0 && event.delta.y === 0)) return

    updateItemPosition(itemId, {
      x: item.x + event.delta.x,
      y: item.y + event.delta.y,
    })
  }

  const orderedItems = useMemo(() => [...items].sort((a, b) => a.y - b.y), [items])

  const handleOpenCourse = (id: string) => {
    openCourseDetail(id)
    if (goal?.id) navigate(`/space/${goal.id}/detail`)
  }

  const handleBackToWorkspace = () => {
    setCanvasView('workspace')
    if (goal?.id) navigate(`/space/${goal.id}`)
  }

  if (canvasView === 'course_detail' && currentCourseId) {
    const course = coursePlans[currentCourseId]
    if (course) {
      return <CourseDetail course={course} onBack={handleBackToWorkspace} />
    }
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <section className="workspace-surface relative h-full min-h-0 flex-1 overflow-auto" aria-label={t("workspace.current_space")}>
        <div className="workspace-stage relative h-full min-w-[980px]">
          {orderedItems.map((item) => {
            const style = { left: item.x, top: item.y }
            if (item.type === 'course-plan') {
              const course = coursePlans[item.id]
              return course ? <DraggableItem key={item.id} id={item.id} className="absolute w-[318px]" style={style}>
                <CoursePlanCard
                  course={course}
                  selected={selectedItemId === item.id}
                  onSelect={() => selectItem(item.id)}
                  onOpen={() => handleOpenCourse(item.id)}
                  onDelete={() => removeItem(item.id)}
                  onRetry={beginCoursePlanGeneration} />
              </DraggableItem> : null
            }
            if (item.type === 'note') {
              const note = notes[item.id]
              return note ? <DraggableItem key={item.id} id={item.id} className="absolute w-[235px]" style={style}>
                <NoteCard
                  note={note}
                  selected={selectedItemId === item.id}
                  onSelect={() => selectItem(item.id)}
                  onChange={(content) => updateNote(item.id, content)}
                  onDelete={() => removeItem(item.id)} />
              </DraggableItem> : null
            }
            return null
          })}
        </div>
      </section>
    </DndContext>
  )
}
