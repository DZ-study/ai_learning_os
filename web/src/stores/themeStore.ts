import { create } from "zustand"

type Theme = "light" | "dark"

function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === "dark") {
    root.classList.add("dark")
  } else {
    root.classList.remove("dark")
  }
}

function getSystemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

function getInitialTheme(): Theme {
  const stored = localStorage.getItem("theme") as Theme | null
  if (stored === "light" || stored === "dark") return stored
  return getSystemTheme()
}

interface ThemeState {
  theme: Theme
  toggle: () => void
}

export const useThemeStore = create<ThemeState>()((set, get) => {
  // Apply initial theme immediately
  const initial = getInitialTheme()
  applyTheme(initial)

  return {
    theme: initial,

    toggle: () => {
      const next = get().theme === "dark" ? "light" : "dark"
      localStorage.setItem("theme", next)
      applyTheme(next)
      set({ theme: next })
    },
  }
})
