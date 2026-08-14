import { cn } from "@/lib/utils"
import { InboxIcon } from "lucide-react"

interface EmptyProps {
  /** 提示文案 */
  title?: string
  /** 自定义图标，默认使用收件箱图标 */
  icon?: React.ReactNode
  className?: string
}

export default function Empty({ title = "暂无数据", icon, className }: EmptyProps) {
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
      <p className="text-sm">{title}</p>
    </div>
  )
}
