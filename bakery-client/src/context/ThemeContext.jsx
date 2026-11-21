import { createContext, useCallback, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)

const STORAGE_KEY = 'happyplate_theme'

function readStoredTheme() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

/**
 * Light/dark theme for the whole site. The choice is persisted and applied
 * as `data-theme` on <html>; the CSS tokens in index.css flip accordingly.
 */
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readStoredTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // Private mode: the theme still applies for this session.
    }
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#16120f' : '#faf7f2')
  }, [theme])

  const toggleTheme = useCallback(
    () => setTheme((current) => (current === 'dark' ? 'light' : 'dark')),
    [],
  )

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
