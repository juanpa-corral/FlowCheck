import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

// ── Tipos ─────────────────────────────────────────────────────

interface ThemeCtx {
  isDark: boolean
  toggle: () => void
}

const ThemeContext = createContext<ThemeCtx>({ isDark: false, toggle: () => {} })

// ── Provider ──────────────────────────────────────────────────

/**
 * Persiste el tema en localStorage y aplica la clase `dark`
 * en <html> para activar los CSS custom properties del tema oscuro.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      return localStorage.getItem('fc_theme') === 'dark'
    } catch {
      return false
    }
  })

  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    try {
      localStorage.setItem('fc_theme', isDark ? 'dark' : 'light')
    } catch { /* storage unavailable */ }
  }, [isDark])

  const toggle = () => setIsDark((d) => !d)

  return (
    <ThemeContext.Provider value={{ isDark, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

// ── Hook de consumo ───────────────────────────────────────────

export function useTheme(): ThemeCtx {
  return useContext(ThemeContext)
}
