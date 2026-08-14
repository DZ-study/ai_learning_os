import { Button } from "@/components/ui/button"
import { useThemeStore } from "@/stores/themeStore"
import { CircleUser, Languages, Moon, Sun } from "lucide-react"
import { useTranslation } from "react-i18next"

export default function Header() {
  const { t, i18n } = useTranslation()
  const { theme, toggle: toggleTheme } = useThemeStore()

  const toggleLang = () => {
    const next = i18n.language === "zh-CN" ? "en-US" : "zh-CN"
    i18n.changeLanguage(next)
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-end border-b border-border bg-background px-4">
      <div className="flex items-center gap-1">
        {/* Language toggle */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleLang}
          aria-label={t("header.switch_lang")}
          title={t("header.switch_lang")}
        >
          <Languages className="size-4" />
        </Button>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleTheme}
          aria-label={t("header.switch_theme")}
          title={t("header.switch_theme")}
        >
          {theme === "dark" ? (
            <Sun className="size-4" />
          ) : (
            <Moon className="size-4" />
          )}
        </Button>

        {/* User profile */}
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t("header.profile")}
          title={t("header.profile")}
        >
          <CircleUser className="size-4" />
        </Button>
      </div>
    </header>
  )
}
