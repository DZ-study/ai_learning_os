/* 常量数据*/

// 菜单项
export const NAV_ITEMS = [
  { to: "/", label: "Home", icon: "" },
  { to: "/goals", label: "Goals", icon: "" },
  { to: "/knowledge", label: "Knowledge", icon: "" },
  { to: "/ai", label: "AI Tutor", icon: "" },
  { to: "/quiz", label: "Quiz", icon: "" },
]


// 目标状态
export const GOAL_STATUS = {
  draft: "未开始",
  active: "进行中",
  paused: "暂停",
  completed: "已完成",
  archived: "归档",
}


// 目标优先级
export const GOAL_PRIORITY = {
  low: { text: "低", color: "gray" },
  medium: { text: "中", color: "green" },
  high: { text: "高", color: "red" },
}