import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark' | 'system'

interface ThemePreferences {
  theme: Theme
  accentColor: string
  fontSize: 'small' | 'medium' | 'large'
  reducedMotion: boolean
  highContrast: boolean
}

interface ThemeState extends ThemePreferences {
  // Actions
  setTheme: (theme: Theme) => void
  setAccentColor: (color: string) => void
  setFontSize: (size: 'small' | 'medium' | 'large') => void
  setReducedMotion: (reduced: boolean) => void
  setHighContrast: (high: boolean) => void
  toggleTheme: () => void
  resetToDefaults: () => void
  // Computed
  resolvedTheme: 'light' | 'dark'
  isDark: boolean
}

const defaultPreferences: ThemePreferences = {
  theme: 'system',
  accentColor: 'indigo',
  fontSize: 'medium',
  reducedMotion: false,
  highContrast: false,
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      ...defaultPreferences,

      // Actions
      setTheme: (theme) => {
        set({ theme })
        applyTheme(theme)
      },

      setAccentColor: (accentColor) => {
        set({ accentColor })
        applyAccentColor(accentColor)
      },

      setFontSize: (fontSize) => {
        set({ fontSize })
        applyFontSize(fontSize)
      },

      setReducedMotion: (reducedMotion) => {
        set({ reducedMotion })
        applyReducedMotion(reducedMotion)
      },

      setHighContrast: (highContrast) => {
        set({ highContrast })
        applyHighContrast(highContrast)
      },

      toggleTheme: () => {
        const currentTheme = get().theme
        const newTheme = currentTheme === 'light' ? 'dark' : 'light'
        get().setTheme(newTheme)
      },

      resetToDefaults: () => {
        set(defaultPreferences)
        applyTheme('system')
        applyAccentColor('indigo')
        applyFontSize('medium')
        applyReducedMotion(false)
        applyHighContrast(false)
      },

      // Computed properties
      get resolvedTheme(): 'light' | 'dark' {
        const { theme } = get()
        if (theme === 'system') {
          return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        }
        return theme
      },

      get isDark(): boolean {
        return get().resolvedTheme === 'dark'
      },
    }),
    {
      name: 'theme-preferences',
      // Only persist these fields
      partialize: (state) => ({
        theme: state.theme,
        accentColor: state.accentColor,
        fontSize: state.fontSize,
        reducedMotion: state.reducedMotion,
        highContrast: state.highContrast,
      }),
      onRehydrateStorage: () => {
        // Apply theme when store is rehydrated
        return (state) => {
          if (state) {
            applyTheme(state.theme)
            applyAccentColor(state.accentColor)
            applyFontSize(state.fontSize)
            applyReducedMotion(state.reducedMotion)
            applyHighContrast(state.highContrast)
          }
        }
      },
    }
  )
)

// Helper functions to apply theme to DOM
function applyTheme(theme: Theme) {
  const root = document.documentElement

  if (theme === 'system') {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    root.setAttribute('data-theme', systemTheme)
    root.classList.remove('light', 'dark')
    root.classList.add(systemTheme)
  } else {
    root.setAttribute('data-theme', theme)
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
  }
}

function applyAccentColor(color: string) {
  const root = document.documentElement
  root.setAttribute('data-accent-color', color)
}

function applyFontSize(size: 'small' | 'medium' | 'large') {
  const root = document.documentElement
  root.setAttribute('data-font-size', size)
}

function applyReducedMotion(reduced: boolean) {
  const root = document.documentElement
  if (reduced) {
    root.setAttribute('data-reduced-motion', 'true')
  } else {
    root.removeAttribute('data-reduced-motion')
  }
}

function applyHighContrast(high: boolean) {
  const root = document.documentElement
  if (high) {
    root.setAttribute('data-high-contrast', 'true')
  } else {
    root.removeAttribute('data-high-contrast')
  }
}

// Listen for system theme changes
if (typeof window !== 'undefined') {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQuery.addEventListener('change', () => {
    const store = useThemeStore.getState()
    if (store.theme === 'system') {
      applyTheme('system')
    }
  })
}