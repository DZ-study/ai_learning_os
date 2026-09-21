
import { Button } from "@/components/ui/button"
import { useCurrentModule } from '@/hooks/useCurrentModule'
import { useThemeStore } from "@/stores/themeStore"
import { CircleUser, Languages, Moon, Sun } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from 'react-router-dom'
import Logo from './Logo'


export default function Header() {
  const { t, i18n } = useTranslation()
  const { theme, toggle: toggleTheme } = useThemeStore()
  const navigate = useNavigate()

  const toggleLang = () => {
    const next = i18n.language === "zh-CN" ? "en-US" : "zh-CN"
    i18n.changeLanguage(next)
  }

  const handleClick = () => {
    navigate("/")
  }

  const { label } = useCurrentModule()

  return (
    <header className="sticky top-0 flex h-16 shrink-0 items-center justify-between border-b border-border bg-background pl-2 pr-4">
      <div className="flex items-center">
        <Logo />
      </div>
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
