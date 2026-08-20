import type { Goal } from '@/types/goal'
import { create } from "zustand"

interface GoalState {
  currentGoal: Goal | null
  setCurrentGoal: (goal: Goal) => void
  getCurrentGoal: () => Goal | null
}

export const useGoalStore = create<GoalState>()((set, get) => ({
  currentGoal: null,

  setCurrentGoal: (goal: Goal) => set({ currentGoal: goal }),

  getCurrentGoal: () => get().currentGoal
}))