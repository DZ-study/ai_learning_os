import { create } from "zustand"

const MIN_WIDTH = 180
const MAX_WIDTH = 400
const DEFAULT_WIDTH = 240
const STORAGE_KEY = "sidebar-state"

function getStored(): { width: number; collapsed: boolean } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (
      typeof parsed.width === "number" &&
      typeof parsed.collapsed === "boolean"
    ) {
      return parsed
    }
  } catch {
    // ignore
  }
  return null
}

function persist(width: number, collapsed: boolean) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ width, collapsed }))
}

interface SidebarState {
  width: number
  collapsed: boolean
  setWidth: (width: number) => void
  toggle: () => void
  /** Clamp width between MIN and MAX */
  resize: (delta: number) => void
}

export const useSidebarStore = create<SidebarState>()((set, get) => {
  const stored = getStored()
  const initialWidth = stored?.width ?? DEFAULT_WIDTH
  const initialCollapsed = stored?.collapsed ?? false

  return {
    width: initialWidth,
    collapsed: initialCollapsed,

    setWidth: (width: number) => {
      const clamped = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, width))
      set({ width: clamped })
      persist(clamped, get().collapsed)
    },

    resize: (delta: number) => {
      const current = get().width
      const clamped = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, current + delta))
      set({ width: clamped })
      persist(clamped, get().collapsed)
    },

    toggle: () => {
      const next = !get().collapsed
      set({ collapsed: next })
      persist(get().width, next)
    },
  }
})

export { MIN_WIDTH, MAX_WIDTH }
