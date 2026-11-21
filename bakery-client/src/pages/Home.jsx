import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, MoonStars, Sun } from 'react-bootstrap-icons'
import api from '../api/client'
import ProductCard from '../components/ProductCard'
import { useLanguage } from '../context/LanguageContext'
import { useTheme } from '../context/ThemeContext'
import useSeo from '../hooks/useSeo'
import { localizedName } from '../utils/localize'

export default function Home() {
  const { t, lang } = useLanguage()
  const { theme, toggleTheme } = useTheme()
  useSeo({ title: null, path: '/' })
  const [topProducts, setTopProducts] = useState([])
  const [featured, setFeatured] = useState([])

  useEffect(() => {
    api.get('/products', { params: { per_page: 4 } }).then((res) => {
      setTopProducts(res.data.data)
    })
    api.get('/products', { params: { featured: 1 } }).then((res) => {
      setFeatured(res.data.data)
    })
  }, [])

  const home = t.home

  return (
    <>
      {/* THEME TOGGLE */}
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? t.theme.light : t.theme.dark}
        title={theme === 'dark' ? t.theme.light : t.theme.dark}
        className="fixed bottom-6 left-6 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-ink/15 bg-surface text-ink shadow-lg transition hover:border-accent hover:text-accent"
      >
        {theme === 'dark' ? (
          <Sun className="h-5 w-5" />
        ) : (
          <MoonStars className="h-5 w-5" />
        )}
      </button>

      {/* HERO */}
      <section className="relative min-h-[85vh] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=85"
          alt="Happy Plate"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ivory via-ivory/85 to-ivory/20" />
        <div className="relative mx-auto flex min-h-[85vh] max-w-6xl items-center px-6">
          <div className="max-w-lg">
            <p className="mb-3 text-sm uppercase tracking-widest text-accent">
              {t.hero.tagline}
            </p>
            <h1 className="font-display mb-4 text-5xl font-bold italic leading-tight text-ink md:text-6xl">
              {t.hero.title1}
              <br />
              {t.hero.title2}
            </h1>
            <p className="mb-8 text-ink/70">{t.hero.subtitle}</p>
            <div className="flex gap-4">
              <Link
                to="/menu"
                className="rounded-lg bg-accent px-6 py-3 text-sm font-medium text-white transition hover:bg-accent-hover"
              >
                {t.hero.ctaShop}
              </Link>
              <Link
                to="/menu"
                className="rounded-lg border border-ink/30 px-6 py-3 text-sm font-medium text-ink transition hover:border-accent hover:text-accent"
              >
                {t.hero.ctaMenu}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* TOP PRODUCTS */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="font-display mb-10 text-center text-4xl font-bold italic text-ink">
          <span className="text-accent">{t.products.topLead}</span> {t.products.topMain}
        </h2>
        <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
          {topProducts.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* ABOUT */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div className="overflow-hidden rounded-3xl shadow-2xl">
            <img
              src="https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=1200&q=80"
              alt={t.about.title}
              className="h-80 w-full object-cover md:h-[420px]"
              loading="lazy"
            />
          </div>

          <div>
            <span className="eyebrow">{t.about.title}</span>
            <h3 className="font-display mb-4 mt-3 text-3xl font-bold leading-tight text-ink md:text-4xl">
              {t.about.heading1}
              <br />
              <span className="text-accent">{t.about.heading2}</span>
            </h3>
            <p className="mb-6 text-sm leading-relaxed text-ink/70">
              {t.about.text}
            </p>
            <ul className="mb-8 space-y-4">
              {t.about.features.map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm font-medium text-ink">
                  <Check className="h-5 w-5 shrink-0 text-accent" />
                  {feature}
                </li>
              ))}
            </ul>
            <Link
              to="/menu"
              className="inline-block rounded-lg bg-accent px-6 py-3 text-sm font-medium text-white transition hover:bg-accent-hover"
            >
              {t.about.cta}
            </Link>
          </div>
        </div>
      </section>

      {/* PROMO BANNER */}
      <section className="relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1600&q=80"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-ivory/85" />
        <div className="relative mx-auto max-w-6xl px-6 py-16 text-center">
          <h3 className="font-display mb-3 text-3xl font-bold italic text-accent md:text-4xl">
            {t.promo.title}
          </h3>
          <p className="mx-auto mb-6 max-w-md text-sm text-ink/70">{t.promo.subtitle}</p>
          <Link
            to="/menu"
            className="inline-block rounded-lg bg-accent px-6 py-3 text-sm font-medium text-white transition hover:bg-accent-hover"
          >
            {t.promo.cta}
          </Link>
        </div>
      </section>

      {/* FEATURED TREATS */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="font-display mb-10 text-center text-4xl font-bold italic text-ink">
          {t.products.featured}
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {featured.map((product) => (
            <div key={product.id} className="text-center">
              <div className="mb-4 overflow-hidden rounded-xl">
                <img
                  src={product.image?.startsWith('http') ? product.image : `https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600&q=80`}
                  alt={localizedName(product, lang)}
                  className="h-56 w-full object-cover transition duration-500 hover:scale-105"
                  loading="lazy"
                />
              </div>
              <h4 className="mb-1 text-sm font-medium text-ink">
                {localizedName(product, lang)}
              </h4>
              <p className="text-sm text-ink/60">{parseFloat(product.price).toFixed(2)} DT</p>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-night py-16">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="font-display text-3xl font-bold italic text-on-night md:text-4xl">
            {home.cta.title}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-on-night/60">
            {home.cta.text}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/reservation"
              className="rounded-lg bg-accent px-6 py-3 text-sm font-medium text-white transition hover:bg-accent-hover"
            >
              {home.cta.primary}
            </Link>
            <Link
              to="/menu"
              className="rounded-lg border border-on-night/30 px-6 py-3 text-sm font-medium text-on-night transition hover:border-accent hover:text-accent"
            >
              {home.cta.secondary}
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
