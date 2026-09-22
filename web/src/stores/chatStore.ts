import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ChatState {
  isOpen: boolean
  mode: 'popup' | 'drawer'
  setOpen: (isOpen: boolean) => void
  setMode: (mode: 'popup' | 'drawer') => void
  toggle: () => void
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      isOpen: true,
      mode: 'popup',
      setOpen: (isOpen) => set({ isOpen }),
      setMode: (mode) => set({ mode, isOpen: true }),
      toggle: () => set((state) => ({ isOpen: !state.isOpen })),
    }),
    {
      name: 'ai-learn-os-chat',
      partialize: (state) => ({ isOpen: state.isOpen }),
    },
  ),
)
