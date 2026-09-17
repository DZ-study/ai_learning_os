import { cn } from "@/lib/utils"
import { InboxIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

interface EmptyProps {
  /** Empty-state message */
  title?: string
  /** Optional icon; the inbox icon is used by default. */
  icon?: React.ReactNode
  className?: string
}

export default function Empty({ title, icon, className }: EmptyProps) {
  const { t } = useTranslation()
  return (
    <div
      className={cn(
        "flex min-h-[200px] flex-col items-center justify-center gap-3 text-muted-foreground",
        className,
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        {icon ?? <InboxIcon className="size-5" />}
      </div>
      <p className="text-sm">{title ?? t("common.empty")}</p>
    </div>
  )
}
