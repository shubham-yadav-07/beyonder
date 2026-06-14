import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'dark' | 'light'

interface ThemeStore {
  theme: Theme
  setTheme: (t: Theme) => void
  toggle: () => void
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      setTheme: (theme) => {
        set({ theme })
        document.documentElement.setAttribute('data-theme', theme)
      },
      toggle: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark'
        get().setTheme(next)
      },
    }),
    { name: 'beyonder-theme' }
  )
)

// Apply theme on load
export function initTheme() {
  const stored = localStorage.getItem('beyonder-theme')
  const theme = stored ? (JSON.parse(stored)?.state?.theme ?? 'dark') : 'dark'
  document.documentElement.setAttribute('data-theme', theme)
}
