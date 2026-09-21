/* Shared constants */
import type { Goal } from '@/types/goal'
// Navigation items
export const NAV_ITEMS = [
  { to: "/", label: "Home", icon: "" },
  { to: "/goals", label: "Goals", icon: "" },
  { to: "/knowledge", label: "Knowledge", icon: "" },
  { to: "/ai", label: "AI Tutor", icon: "" },
  { to: "/quiz", label: "Quiz", icon: "" },
]


// Goal status translation keys
export const GOAL_STATUS = {
  draft: "goal.status.draft",
  active: "goal.status.active",
  paused: "goal.status.paused",
  completed: "goal.status.completed",
  archived: "goal.status.archived",
}


// Goal priority translation keys
export const GOAL_PRIORITY = {
  low: { text: "goal.priority.low", color: "gray" },
  medium: { text: "goal.priority.medium", color: "green" },
  high: { text: "goal.priority.high", color: "red" },
}

export const STATUS_STYLES: Record<Goal['status'], string> = {
  draft: 'bg-gray-100 text-gray-500',
  active: 'bg-blue-50 text-blue-600',
  paused: 'bg-amber-50 text-amber-600',
  completed: 'bg-emerald-50 text-emerald-600',
  archived: 'bg-gray-100 text-gray-400',
}

export const GOAL_ICONS: Array<{ keywords: string[]; icon: string; className: string }> = [
  { keywords: ['react'], icon: '⚛️', className: 'bg-sky-50' },
  { keywords: ['python'], icon: '🐍', className: 'bg-emerald-50' },
  { keywords: ['sql', '数据库', '数据'], icon: '🗄️', className: 'bg-indigo-50' },
  { keywords: ['摄影', '拍照', 'photo'], icon: '📷', className: 'bg-rose-50' },
  { keywords: ['英语', 'english', '外语'], icon: '🗣️', className: 'bg-amber-50' },
  { keywords: ['设计', 'design'], icon: '🎨', className: 'bg-violet-50' },
  { keywords: ['健身', '运动', '跑步'], icon: '🏃', className: 'bg-lime-50' },
]
