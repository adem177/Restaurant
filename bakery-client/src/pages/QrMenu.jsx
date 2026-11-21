import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowRight, Leaf } from 'react-bootstrap-icons'
import api from '../api/client'
import { useCart } from '../context/CartContext'
import { useLanguage } from '../context/LanguageContext'
import LanguageSwitcher from '../components/LanguageSwitcher'
import Logo from '../components/Logo'
import { flyToCart } from '../utils/flyToCart'
import ProductModal from '../components/ProductModal'
import useSeo from '../hooks/useSeo'
import { localizedName, localizedDescription } from '../utils/localize'

/**
 * Public QR-code menu for table service.
 * Opened by customers after scanning the code on their table:
 * /qr?table=3
 */
export default function QrMenu() {
  const [searchParams] = useSearchParams()
  const table = searchParams.get('table') || '?'
  const { t, lang } = useLanguage()
  const { addItem, count, total } = useCart()
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [activeCategory, setActiveCategory] = useState('')
  const [justAdded, setJustAdded] = useState(null)
  const [modalId, setModalId] = useState(null)

  useSeo({
    title: `${t.menu.title} — ${lang === 'ar' ? 'طاولة' : 'Table'} #${table}`,
    description: t.menu.subtitle,
    path: `/qr?table=${table}`,
  })

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data.data))
    api.get('/products', { params: { per_page: 48 } }).then((res) => setProducts(res.data.data))
  }, [])

  const grouped = useMemo(() => {
    const map = {}
    for (const product of products) {
      const key = product.category?.slug || 'other'
      if (!map[key]) map[key] = []
      map[key].push(product)
    }
    return map
  }, [products])

  const visibleCategories = activeCategory
    ? categories.filter((c) => c.slug === activeCategory)
    : categories

  const handleAdd = (product, sourceEl) => {
    // A required size means we need the modal before we can price the line.
    if ((product.option_groups || []).some((g) => g.is_required)) {
      setModalId(product.id)
      return
    }
    addItem(product)
    setJustAdded(product.id)
    setTimeout(() => setJustAdded(null), 1000)
    flyToCart(sourceEl)
  }

  return (
    <div className="min-h-screen bg-ivory pb-24">
      {/* Sticky header */}
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-ivory/95 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Logo
              variant="badge"
              iconClass="h-5 w-5"
              textClass="text-sm font-bold"
              subtitle={`${lang === 'ar' ? 'طاولة' : 'Table'} #${table}`}
            />
          </div>
          <LanguageSwitcher />
        </div>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto px-4 pb-3">
          <button
            onClick={() => setActiveCategory('')}
            className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs transition ${
              activeCategory === ''
                ? 'bg-accent text-white'
                : 'bg-surface text-ink/60'
            }`}
          >
            {t.products.all}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.slug)}
              className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs transition ${
                activeCategory === cat.slug
                  ? 'bg-accent text-white'
                  : 'bg-surface text-ink/60'
              }`}
            >
              {localizedName(cat, lang)}
            </button>
          ))}
        </div>
      </header>

      {/* Menu list */}
      <main className="mx-auto max-w-lg px-4 py-4">
        {visibleCategories.map((cat) => {
          const items = grouped[cat.slug] || []
          if (items.length === 0) return null
          return (
            <section key={cat.id} className="mb-8">
              <h2 className="font-display mb-3 text-xl font-bold italic text-ink">
                {localizedName(cat, lang)}
              </h2>
              <div className="space-y-3">
                {items.map((product) => {
                  const soldOut = product.in_stock === false

                  return (
                    <div
                      key={product.id}
                      className={`flex items-center gap-3 rounded-xl bg-surface p-3 ${
                        soldOut ? 'opacity-60' : ''
                      }`}
                    >
                    <img
                      src={
                        product.image?.startsWith('http')
                          ? product.image
                          : 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&q=80'
                      }
                      alt={localizedName(product, lang)}
                      className="h-16 w-16 flex-shrink-0 rounded-lg object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="truncate text-sm font-medium text-ink">
                          {localizedName(product, lang)}
                        </h3>
                        {product.is_vegetarian && <Leaf className="h-3.5 w-3.5 text-green-600" />}
                        {product.is_gluten_free && (
                          <span className="rounded bg-green-600/60 px-1 text-[9px] font-bold text-white">GF</span>
                        )}
                        {soldOut && (
                          <span className="rounded bg-red-600/80 px-1 text-[9px] font-bold text-white">
                            {t.products.soldOut}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-xs text-ink/50">
                        {localizedDescription(product, lang)}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-accent">
                        {parseFloat(product.price).toFixed(2)} DT
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleAdd(product, e.currentTarget)}
                      disabled={soldOut}
                      className={`flex-shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition ${
                        soldOut
                          ? 'cursor-not-allowed bg-ivory text-ink/40'
                          : justAdded === product.id
                            ? 'bg-green-600 text-white ring-1 ring-green-400/40'
                            : 'bg-accent text-white hover:bg-accent-hover'
                      }`}
                    >
                      {soldOut ? (
                        t.products.soldOut
                      ) : justAdded === product.id ? (
                        t.products.added
                      ) : (
                        t.products.add
                      )}
                    </button>
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}
      </main>

      {/* Sticky cart bar */}
      {count > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-ivory-dark/95 p-4 backdrop-blur">
          <div className="mx-auto flex max-w-lg items-center justify-between">
            <div>
              <p className="text-xs text-ink/50">
                {count} {lang === 'ar' ? 'عنصر' : 'article(s)'}
              </p>
              <p className="font-display text-lg font-bold text-ink">
                {total.toFixed(2)} DT
              </p>
            </div>
            <a
              href="/cart"
              data-fly-cart
              className="rounded-lg bg-accent px-5 py-3 text-sm font-medium text-white transition hover:bg-accent-hover"
            >
              <span className="inline-flex items-center gap-2">
                {t.cart.checkout}
                <ArrowRight className="h-4 w-4" />
              </span>
            </a>
          </div>
        </div>
      )}
      {/* Option / detail modal */}
      {modalId && (
        <ProductModal productId={modalId} onClose={() => setModalId(null)} />
      )}
    </div>
  )
}
