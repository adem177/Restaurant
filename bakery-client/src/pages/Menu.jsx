import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Leaf, SlashCircle, XLg } from 'react-bootstrap-icons'
import api from '../api/client'
import ProductCard from '../components/ProductCard'
import { useLanguage } from '../context/LanguageContext'
import useSeo from '../hooks/useSeo'
import { localizedName } from '../utils/localize'

const queryFromLocation = (location) =>
  new URLSearchParams(location.search).get('q') || ''

export default function Menu() {
  const { t, lang } = useLanguage()
  useSeo({ title: t.menu.title, description: t.menu.subtitle, path: '/menu' })
  const location = useLocation()
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [activeCategory, setActiveCategory] = useState('')
  const [search, setSearch] = useState(() => queryFromLocation(location))
  const [vegetarian, setVegetarian] = useState(false)
  const [glutenFree, setGlutenFree] = useState(false)
  const [hideSoldOut, setHideSoldOut] = useState(false)
  const [allergens, setAllergens] = useState([])
  const [avoided, setAvoided] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data.data))
    api.get('/allergens').then((res) => setAllergens(res.data.data)).catch(() => setAllergens([]))
  }, [])

  // The navbar search submits `/menu?q=…`: apply the keyword on every
  // navigation (the location object changes even for a same-URL search).
  useEffect(() => {
    setSearch(queryFromLocation(location))
  }, [location])

  useEffect(() => {
    setLoading(true)
    const params = {}
    if (activeCategory) params.category = activeCategory
    if (vegetarian) params.vegetarian = 1
    if (glutenFree) params.gluten_free = 1
    if (hideSoldOut) params.available = 1
    if (avoided.length > 0) params.exclude_allergen = avoided.join(',')
    if (search) params.search = search
    params.per_page = 24

    api
      .get('/products', { params })
      .then((res) => setProducts(res.data.data))
      .finally(() => setLoading(false))
  }, [activeCategory, search, vegetarian, glutenFree, hideSoldOut, avoided])

  const toggleAvoid = (code) =>
    setAvoided((current) =>
      current.includes(code) ? current.filter((c) => c !== code) : [...current, code],
    )

  return (
    <section className="mx-auto max-w-6xl px-6 pb-20 pt-28">
      <h1 className="font-display mb-2 text-center text-4xl font-bold italic text-ink">
        {t.menu.title}
      </h1>
      <p className="mb-10 text-center text-sm text-ink/60">{t.menu.subtitle}</p>

      {/* Search + filters */}
      <div className="mb-8 flex flex-col items-center gap-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.products.search}
          className="w-full max-w-sm rounded-lg border border-ink/20 bg-surface px-4 py-2 text-sm text-ink placeholder-ink/40 outline-none focus:border-accent"
        />
        <div className="flex gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-ink/70">
            <input
              type="checkbox"
              checked={vegetarian}
              onChange={(e) => setVegetarian(e.target.checked)}
              className="accent-accent"
            />
            <Leaf className="h-4 w-4 text-green-600" />
            {t.products.vegetarian}
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-ink/70">
            <input
              type="checkbox"
              checked={glutenFree}
              onChange={(e) => setGlutenFree(e.target.checked)}
              className="accent-accent"
            />
            GF {t.products.glutenFree}
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-ink/70">
            <input
              type="checkbox"
              checked={hideSoldOut}
              onChange={(e) => setHideSoldOut(e.target.checked)}
              className="accent-accent"
            />
            <SlashCircle className="h-4 w-4 text-red-600" />
            {t.products.hideSoldOut}
          </label>
        </div>

        {/* Allergens to avoid */}
        {allergens.length > 0 && (
          <div className="w-full max-w-3xl rounded-xl bg-surface p-4">
            <p className="mb-1 text-sm text-ink/70">{t.products.avoidAllergens}</p>
            <p className="mb-3 text-xs text-ink/40">{t.products.avoidAllergensHint}</p>
            <div className="flex flex-wrap gap-2">
              {allergens.map((allergen) => {
                const active = avoided.includes(allergen.code)
                return (
                  <button
                    key={allergen.id}
                    onClick={() => toggleAvoid(allergen.code)}
                    className={`rounded-full px-3 py-1 text-xs transition ${
                      active
                        ? 'bg-amber-500 text-ink font-semibold'
                        : 'bg-ivory text-ink/60 hover:text-ink'
                    }`}
                  >
                    {localizedName(allergen, lang)}
                  </button>
                )
              })}
              {avoided.length > 0 && (
                <button
                  onClick={() => setAvoided([])}
                  className="rounded-full bg-ivory px-3 py-1 text-xs text-red-600 transition hover:text-red-600"
                >
                  <XLg className="mr-1 inline h-3 w-3" /> {t.products.none}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Category tabs */}
      <div className="mb-10 flex flex-wrap justify-center gap-5 border-b border-ink/10 pb-3">
        <button
          onClick={() => setActiveCategory('')}
          className={`pb-2 text-sm transition ${
            activeCategory === '' ? 'font-semibold text-accent' : 'text-ink/60 hover:text-ink'
          }`}
        >
          {t.products.all}
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.slug)}
            className={`pb-2 text-sm transition ${
              activeCategory === cat.slug
                ? 'font-semibold text-accent'
                : 'text-ink/60 hover:text-ink'
            }`}
          >
            {localizedName(cat, lang)}
          </button>
        ))}
      </div>

      {/* Products grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-xl bg-surface" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <p className="py-20 text-center text-ink/50">{t.products.empty}</p>
      ) : (
        <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  )
}
