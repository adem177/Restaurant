import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Search, XLg } from 'react-bootstrap-icons'
import api from '../api/client'
import { useLanguage } from '../context/LanguageContext'
import { imageSources, productImage } from '../utils/images'
import { localizedName } from '../utils/localize'

/**
 * Full-screen search panel opened from the navbar button: live product
 * suggestions while typing, and submit filters the menu page (`/menu?q=`).
 * Rendered only while open — mounting it resets the field and focus.
 */
export default function SearchOverlay({ onClose }) {
  const { t, lang } = useLanguage()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)

  // Focus the field and lock the background scroll while the panel is open.
  useEffect(() => {
    inputRef.current?.focus()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  // Escape closes the panel.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // Debounced live suggestions.
  useEffect(() => {
    const term = query.trim()
    if (term.length < 2) {
      setResults([])
      return undefined
    }
    setLoading(true)
    const timer = setTimeout(() => {
      api
        .get('/products', { params: { search: term, per_page: 6 } })
        .then((res) => setResults(res.data.data))
        .catch(() => setResults([]))
        .finally(() => setLoading(false))
    }, 250)
    return () => clearTimeout(timer)
  }, [query])

  const goToMenu = (term) => {
    const value = term.trim()
    if (!value) return
    onClose()
    navigate(`/menu?q=${encodeURIComponent(value)}`)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    goToMenu(query)
  }

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={t.search.title}>
      {/* Backdrop */}
      <button
        type="button"
        aria-label={t.search.open}
        onClick={onClose}
        data-no-magnet
        className="absolute inset-0 cursor-default bg-ink/60 backdrop-blur-sm"
      />

      <div className="overlay-in relative mx-auto mt-20 w-full max-w-2xl px-6">
        <div className="overflow-hidden rounded-2xl bg-ivory shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
            <h2 className="font-display text-lg font-semibold italic text-ink">{t.search.title}</h2>
            <button
              type="button"
              onClick={onClose}
              data-no-magnet
              aria-label="Fermer"
              className="text-ink/50 transition hover:text-accent"
            >
              <XLg className="h-4 w-4" />
            </button>
          </div>

          {/* CaterServ-style bar: input + square search button */}
          <form onSubmit={handleSubmit} className="p-4">
            <div className="flex items-stretch overflow-hidden rounded-lg border border-ink/20 bg-surface transition focus-within:border-accent">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.search.placeholder}
                className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-ink placeholder-ink/40 outline-none"
              />
              <button
                type="submit"
                aria-label={t.search.button}
                data-no-magnet
                className="flex w-12 shrink-0 items-center justify-center bg-accent text-white transition hover:bg-accent-hover"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </form>

          {/* Suggestions */}
          <div className="max-h-80 overflow-y-auto px-4 pb-4">
            {query.trim().length < 2 ? (
              <p className="py-6 text-center text-xs text-ink/40">{t.search.hint}</p>
            ) : loading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded-lg bg-surface" />
                ))}
              </div>
            ) : results.length === 0 ? (
              <p className="py-6 text-center text-xs text-ink/50">{t.search.noResults}</p>
            ) : (
              <ul className="space-y-1">
                {results.map((product) => (
                  <li key={product.id}>
                    <button
                      type="button"
                      onClick={() => goToMenu(localizedName(product, lang))}
                      className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-surface"
                    >
                      <img
                        src={imageSources(productImage(product.image)).src}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded-lg object-cover"
                        loading="lazy"
                      />
                      <span className="min-w-0 flex-1 truncate text-sm text-ink">
                        {localizedName(product, lang)}
                      </span>
                      <span className="shrink-0 text-sm font-semibold text-accent">
                        {parseFloat(product.price).toFixed(2)} DT
                      </span>
                    </button>
                  </li>
                ))}
                <li>
                  <button
                    type="button"
                    onClick={() => goToMenu(query)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-ink/20 px-2 py-2.5 text-xs text-ink/60 transition hover:border-accent hover:text-accent"
                  >
                    {t.search.allResults}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
