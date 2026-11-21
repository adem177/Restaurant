import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'react-bootstrap-icons'
import { LANGUAGES, useLanguage } from '../context/LanguageContext'

/**
 * Language dropdown switcher (FR / EN / AR).
 * Shows the current language short code and opens a menu on click.
 */
export default function LanguageSwitcher({ align = 'right' }) {
  const { lang, setLang } = useLanguage()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const current = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0]

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 rounded-full border border-ink/20 px-3 py-1 text-xs text-ink/80 transition hover:border-accent hover:text-accent"
        aria-label="Change language"
      >
        {current.short}
        <ChevronDown className={`h-3 w-3 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className={`absolute z-50 mt-2 w-36 overflow-hidden rounded-xl border border-ink/10 bg-ivory-dark py-1 shadow-xl ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {LANGUAGES.map((language) => (
            <button
              key={language.code}
              onClick={() => {
                setLang(language.code)
                setOpen(false)
              }}
              className={`flex w-full items-center justify-between px-4 py-2 text-sm transition ${
                language.code === current.code
                  ? 'bg-accent/15 text-accent'
                  : 'text-ink/70 hover:bg-surface hover:text-ink'
              }`}
            >
              <span>{language.label}</span>
              <span className="text-xs opacity-60">{language.short}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
