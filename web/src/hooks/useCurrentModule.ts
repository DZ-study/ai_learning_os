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

  // 1. Prefer dynamic /goals/:id/... routes.
  const goalMatch = pathname.match(/^\/goals\/([^/]+)(\/.*)?$/)
  if (goalMatch) {
    // Use a generic label here; the current goal can be resolved from the store.
    const currentGoal = getCurrentGoal()
    const label = currentGoal ? `${t("menu.my_goals")} > ${currentGoal.title}` : t("menu.my_goals")
    return {
      label,
      isDynamic: true,
      id: goalMatch[1]
    }
  }

  // 2. Match static routes.
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

  // 3. Fallback.
  return { label: '', isDynamic: false }
}
