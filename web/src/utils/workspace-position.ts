import type { WorkspaceItem, WorkspaceItemPosition } from '@/types/workspace'

const START_POSITION = { x: 42, y: 78 }
const COLUMN_STEP = 360
const ROW_STEP = 220
const MAX_COLUMNS = 3

export function getNextAvailablePosition(
  items: WorkspaceItem[],
): WorkspaceItemPosition {
  const occupied = new Set(items.map((item) => `${item.x}:${item.y}`))

  for (let index = 0; ; index += 1) {
    const column = index % MAX_COLUMNS
    const row = Math.floor(index / MAX_COLUMNS)
    const position = {
      x: START_POSITION.x + column * COLUMN_STEP,
      y: START_POSITION.y + row * ROW_STEP,
    }

    if (!occupied.has(`${position.x}:${position.y}`)) return position
  }
}
