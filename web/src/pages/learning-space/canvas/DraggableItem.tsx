import { useDraggable } from '@dnd-kit/core'
import type { CSSProperties, ReactNode } from 'react'

interface DraggableItemProps {
  id: string
  children: ReactNode
  className?: string
  style?: CSSProperties
}

export default function DraggableItem({ id, children, className, style }: DraggableItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id })

  const dragStyle: CSSProperties = {
    ...style,
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    zIndex: isDragging ? 50 : style?.zIndex,
    cursor: isDragging ? 'grabbing' : 'grab',
    touchAction: 'none',
    userSelect: 'none',
  }

  return (
    <div
      ref={setNodeRef}
      className={className}
      style={dragStyle}
      {...listeners}
      {...attributes}
    >
      {children}
    </div>
  )
}
