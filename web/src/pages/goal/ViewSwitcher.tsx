import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Grid2X2, List } from "lucide-react"

export type ViewMode = "list" | "card"

interface ViewSwitcherProps {
  value: ViewMode
  onChange: (value: ViewMode) => void
}

export function ViewSwitcher({
  value,
  onChange,
}: ViewSwitcherProps) {
  return (
    <div className="inline-flex items-center rounded-md border">
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "rounded-r-none",
          value === "list" &&
          "bg-muted text-foreground"
        )}
        onClick={() => onChange("list")}
      >
        <List />
      </Button>

      <div className="h-5 w-px bg-border" />

      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "rounded-l-none",
          value === "card" &&
          "bg-muted text-foreground"
        )}
        onClick={() => onChange("card")}
      >
        <Grid2X2 />
      </Button>
    </div>
  )
}