import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeMode = 'light' | 'dark' | 'system'

export const ACCENT_PRESETS = [
  '#6366f1',
  '#0ea5e9',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
] as const

export type ThemeStore = {
  theme: ThemeMode
  accent: string
  setTheme: (theme: ThemeMode) => void
  setAccent: (accent: string) => void
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h
  const n = parseInt(full, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function mix(base: string, target: string, weight: number): string {
  const [r1, g1, b1] = hexToRgb(base)
  const [r2, g2, b2] = hexToRgb(target)
  const toHex = (v: number) => Math.round(v).toString(16).padStart(2, '0')
  const r = r1 + (r2 - r1) * weight
  const g = g1 + (g2 - g1) * weight
  const b = b1 + (b2 - b1) * weight
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function applyAccent(accent: string) {
  const root = document.documentElement
  root.style.setProperty('--color-brand-500', accent)
  const steps: Array<[string, string, number]> = [
    ['50', '#ffffff', 0.92],
    ['100', '#ffffff', 0.84],
    ['200', '#ffffff', 0.68],
    ['300', '#ffffff', 0.5],
    ['400', '#ffffff', 0.26],
    ['600', '#000000', 0.12],
    ['700', '#000000', 0.24],
    ['800', '#000000', 0.36],
    ['900', '#000000', 0.5],
  ]
  for (const [step, target, weight] of steps) {
    root.style.setProperty(`--color-brand-${step}`, mix(accent, target, weight))
  }
}

function resolveTheme(theme: ThemeMode): 'light' | 'dark' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return theme
}

function applyTheme(theme: ThemeMode, accent: string) {
  const root = document.documentElement
  const effective = resolveTheme(theme)
  root.classList.toggle('dark', effective === 'dark')
  root.dataset.theme = effective
  applyAccent(accent)
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => {
      if (typeof window !== 'undefined') {
        const media = window.matchMedia('(prefers-color-scheme: dark)')
        const onChange = () => applyTheme(get().theme, get().accent)
        media.addEventListener('change', onChange)
      }

      return {
        theme: 'light',
        accent: ACCENT_PRESETS[0],
        setTheme: (theme) => {
          set({ theme })
          applyTheme(theme, get().accent)
        },
        setAccent: (accent) => {
          set({ accent })
          applyTheme(get().theme, accent)
        },
      }
    },
    {
      name: 'taskflow_theme',
      partialize: (state) => ({ theme: state.theme, accent: state.accent }),
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.theme, state.accent)
      },
    },
  ),
)