import GoalCard from '@/pages/goal/GoalCard'
import { goalKeys } from '@/query/keys'
import { getGoals } from '@/services/goal'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

export default function GoalPage() {
  const { t } = useTranslation()
  const { data: goals } = useQuery({
    queryKey: goalKeys.list(),
    queryFn: getGoals
  })

  if (!goals?.length) return null

  return (
    <section className="mt-14 w-full max-w-6xl">
      <div className="mb-5 flex items-baseline gap-2">
        <h2 className="text-lg font-semibold text-[#1a2b4b]">{t("menu.my_goals")}</h2>
        <span className="text-xs text-gray-400">{goals.length}</span>
      </div>
      <GoalCard data={goals} />
    </section>
  )
}
