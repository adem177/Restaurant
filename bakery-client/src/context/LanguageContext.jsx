import { createContext, useContext, useEffect, useState } from 'react'
import { translations } from '../i18n/translations'

const LanguageContext = createContext(null)

export const LANGUAGES = [
  { code: 'fr', label: 'Français', short: 'FR', dir: 'ltr' },
  { code: 'en', label: 'English', short: 'EN', dir: 'ltr' },
  { code: 'ar', label: 'العربية', short: 'AR', dir: 'rtl' },
]

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'fr')

  useEffect(() => {
    const current = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0]
    document.documentElement.lang = current.code
    document.documentElement.dir = current.dir
    localStorage.setItem('lang', current.code)
  }, [lang])

  const t = translations[lang]

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}
