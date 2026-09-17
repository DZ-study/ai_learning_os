import { useTranslation } from 'react-i18next'

export default function AgentPage() {
  const { t } = useTranslation()
  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold">{t("menu.agent")}</h1>
      <p className="text-muted-foreground">
        Plan and manage your learning agents and automated tasks.
      </p>
    </div>
  )
}
