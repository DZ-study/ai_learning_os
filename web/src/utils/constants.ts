/* Shared constants */

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
