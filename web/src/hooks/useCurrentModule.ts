// hooks/useCurrentModule.ts
import { menuItems } from '@/components/layout/Sidebar'
import { useGoalStore } from '@/stores/goalStore'
import { useTranslation } from "react-i18next"
import { useLocation } from "react-router-dom"

export const useCurrentModule = () => {
  const { t } = useTranslation()
  const location = useLocation()
  const pathname = location.pathname
  const { getCurrentGoal } = useGoalStore()

  // 1. 优先匹配动态路由 /goals/:id/...
  const goalMatch = pathname.match(/^\/goals\/([^/]+)(\/.*)?$/)
  if (goalMatch) {
    // 这里可以返回一个通用的“我的目标”文案，
    // 或者根据 goalMatch[1] 去查具体的目标名称（如果需要更高级的功能）
    const currentGoal = getCurrentGoal()
    const label = currentGoal ? `${t("menu.my_goals")} > ${currentGoal.title}` : t("menu.my_goals")
    return {
      label, // 例如: "我的目标" 或 "My Goals"
      isDynamic: true,
      id: goalMatch[1]
    }
  }

  // 2. 匹配静态路由
  const matchedStatic = menuItems.find((item) => {
    if (item.exact) return pathname === item.path
    return pathname.startsWith(item.path)
  })

  if (matchedStatic) {
    console.log(matchedStatic);

    return {
      label: t(`menu.${matchedStatic.key}`),
      isDynamic: false,
    }
  }

  // 3. 兜底
  return { label: '', isDynamic: false }
}