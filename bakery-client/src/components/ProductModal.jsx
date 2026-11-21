import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ExclamationTriangleFill, Leaf, Star, StarFill, XLg } from 'react-bootstrap-icons'
import api from '../api/client'
import { useCart } from '../context/CartContext'
import { useClientAuth } from '../context/ClientAuthContext'
import { useLanguage } from '../context/LanguageContext'
import { productImage } from '../utils/images'
import { localizedName, localizedDescription } from '../utils/localize'
import Stars from './Stars'
import { flyToCart } from '../utils/flyToCart'

/**
 * Pre-select the first value of each required group (radio groups) and leave
 * optional groups empty until the customer picks something.
 */
function defaultSelection(product) {
  const next = {}
  for (const group of product?.option_groups || []) {
    next[group.id] = group.is_required ? group.values[0]?.id ?? null : null
  }
  return next
}

/** Add or remove one value inside a group, honouring single vs multi. */
function toggleOption(current, groupId, valueId, multi) {
  if (!multi) {
    return { ...current, [groupId]: valueId }
  }

  const picked = current[groupId] || []
  return {
    ...current,
    [groupId]: picked.includes(valueId)
      ? picked.filter((id) => id !== valueId)
      : [...picked, valueId],
  }
}

/** Flatten the picked ids, dropping nulls so an optional group can be empty. */
function pickedOptionIds(product, selection) {
  const ids = []
  for (const group of product?.option_groups || []) {
    const chosen = selection[group.id]
    if (group.selection === 'single') {
      if (chosen != null) ids.push(chosen)
    } else if (Array.isArray(chosen)) {
      ids.push(...chosen)
    }
  }
  return ids
}

/** Live unit price while the customer picks options. */
function currentPrice(product, selection) {
  const ids = pickedOptionIds(product, selection)
  let price = parseFloat(product.price)
  for (const group of product.option_groups || []) {
    for (const value of group.values || []) {
      if (ids.includes(value.id)) price += parseFloat(value.price_delta || 0)
    }
  }
  return price
}

/**
 * Single nutrition figure; hidden when the value is not published.
 */
function NutritionStat({ label, value, unit }) {
  if (value === null || value === undefined) {
    return <div />
  }

  return (
    <div>
      <p className="text-sm font-semibold text-ink">{value}{unit}</p>
      <p className="text-[10px] text-ink/40">{label}</p>
    </div>
  )
}

/**
 * Product detail modal: description, stock state, rating and reviews.
 * Signed-in clients can post/update their own review (one per product).
 */
export default function ProductModal({ productId, onClose }) {
  const { t, lang } = useLanguage()
  const { user } = useClientAuth()
  const { addItem, openCart } = useCart()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [added, setAdded] = useState(false)
  // Selected option value id per group id (radio groups hold a single id).
  const [selection, setSelection] = useState({})
  const [notice, setNotice] = useState(null)
  const [error, setError] = useState(null)

  const load = () =>
    api
      .get(`/products/${productId}`)
      .then((res) => {
        const data = res.data.data
        setProduct(data)
        setSelection(defaultSelection(data))
        const mine = (data.reviews || []).find((r) => r.is_mine)
        if (mine) {
          setRating(mine.rating)
          setComment(mine.comment || '')
        }
      })
      .finally(() => setLoading(false))

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setNotice(null)
    setError(null)
    try {
      await api.post(`/products/${productId}/reviews`, { rating, comment })
      setNotice(t.reviews.submitted)
      await load()
    } catch (err) {
      const data = err.response?.data
      setError(
        err.response?.status === 401
          ? t.reviews.loginRequired
          : Object.values(data?.errors || {}).flat().join(' ') || 'Erreur',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass =
    'w-full rounded-lg border border-ink/20 bg-surface px-3 py-2 text-sm text-ink placeholder-ink/40 outline-none focus:border-accent'

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-ivory-dark"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative">
          <button
            onClick={onClose}
            className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-ivory/70 text-ink transition hover:bg-accent"
            aria-label="Close"
          >
            <XLg className="h-4 w-4" />
          </button>
          {product && (
            <img
              src={productImage(product.image)}
              alt={localizedName(product, lang)}
              className="h-48 w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          )}
        </div>

        {loading || !product ? (
          <div className="space-y-3 p-6">
            <div className="h-5 w-2/3 animate-pulse rounded bg-surface" />
            <div className="h-4 w-full animate-pulse rounded bg-surface" />
            <div className="h-24 w-full animate-pulse rounded bg-surface" />
          </div>
        ) : (
          <div className="p-6">
            <div className="mb-1 flex items-start justify-between gap-3">
              <h2 className="font-display text-xl font-semibold text-ink">
                {localizedName(product, lang)}
              </h2>
              <span className="whitespace-nowrap font-display text-lg font-bold text-accent">
                {(product.option_groups || []).length > 0 && (
                  <span className="mr-1 text-xs font-normal text-ink/40">
                    {t.products.from}
                  </span>
                )}
                {parseFloat(product.price).toFixed(2)} DT
              </span>
            </div>

            <div className="mb-3">
              <Stars
                value={product.rating_avg}
                count={product.reviews_count}
              />
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              {product.is_vegetarian && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-800/60 px-2.5 py-1 text-xs text-ink">
                  <Leaf className="h-3 w-3" /> {t.products.vegetarian}
                </span>
              )}
              {product.is_gluten_free && (
                <span className="rounded-full bg-green-600/60 px-2.5 py-1 text-xs text-ink">
                  GF {t.products.glutenFree}
                </span>
              )}
            </div>

            {/* Options: sizes (radio) and extras (checkbox) */}
            {(product.option_groups || []).map((group) => (
              <div key={group.id} className="mb-4">
                <p className="mb-1.5 text-xs uppercase tracking-wide text-ink/40">
                  {localizedName(group, lang)}
                  {group.is_required && <span className="ml-1 text-red-600">*</span>}
                </p>
                <div className="flex flex-wrap gap-2">
                  {group.values.map((value) => {
                    const selected =
                      group.selection === 'single'
                        ? selection[group.id] === value.id
                        : (selection[group.id] || []).includes(value.id)

                    return (
                      <button
                        key={value.id}
                        type="button"
                        onClick={() =>
                          setSelection((current) =>
                            toggleOption(current, group.id, value.id, group.selection === 'multi'),
                          )
                        }
                        className={`rounded-full px-3 py-1.5 text-xs transition ${
                          selected
                            ? 'bg-accent text-white'
                            : 'bg-surface text-ink/60 hover:text-ink'
                        }`}
                      >
                        {localizedName(value, lang)}
                        {parseFloat(value.price_delta) > 0 && (
                          <span className={selected ? 'text-white/80' : 'text-ink/40'}>
                            {' '}
                            +{parseFloat(value.price_delta).toFixed(2)}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}

            {/* Allergens */}
            {(product.allergens || []).length > 0 && (
              <div className="mb-4">
                <p className="mb-1.5 text-xs uppercase tracking-wide text-ink/40">
                  {t.products.allergens}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {product.allergens.map((allergen) => (
                    <span
                      key={allergen.id}
                      title={localizedName(allergen, lang)}
                      className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs text-amber-600"
                    >
                      <ExclamationTriangleFill className="mr-1 inline h-3 w-3" />
                      {localizedName(allergen, lang)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Nutrition */}
            {product.calories !== null && product.calories !== undefined && (
              <div className="mb-4 rounded-lg bg-surface p-3">
                <p className="mb-2 text-xs uppercase tracking-wide text-ink/40">
                  {t.products.nutrition}
                </p>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <NutritionStat label={t.products.calories} value={product.calories} unit="kcal" />
                  <NutritionStat label={t.products.carbs} value={product.carbs_g} unit="g" />
                  <NutritionStat label={t.products.fat} value={product.fat_g} unit="g" />
                  <NutritionStat label={t.products.protein} value={product.protein_g} unit="g" />
                </div>
              </div>
            )}

            <p className="mb-6 text-sm leading-relaxed text-ink/70">
              {localizedDescription(product, lang)}
            </p>

            {/* Stock state + add to cart */}
            {product.in_stock === false ? (
              <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600">
                {t.products.soldOut} — {t.products.outOfStockError}
              </div>
            ) : (
              <div className="mb-6 flex items-center gap-3">
                <button
                  onClick={(e) => {
                    const btn = e.currentTarget
                    const options = pickedOptionIds(product, selection)
                      .map((id) =>
                        product.option_groups
                          .flatMap((group) => group.values)
                          .find((value) => value.id === id),
                      )
                      .filter(Boolean)
                    addItem(product, options)
                    setAdded(true)
                    setTimeout(() => setAdded(false), 1200)
                    // Fly the glyph, then close the modal and slide the
                    // cart drawer open once it lands.
                    flyToCart(btn, () => {
                      onClose()
                      openCart()
                    })
                  }}
                  className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                    added
                      ? 'bg-green-600 text-white ring-1 ring-green-400/40'
                      : 'bg-accent text-white hover:bg-accent-hover'
                  }`}
                >
                  {added ? (
                    t.products.added
                  ) : (
                    `${t.products.add} — ${currentPrice(product, selection).toFixed(2)} DT`
                  )}
                </button>
                {product.stock !== null && product.stock > 0 && product.stock <= 5 && (
                  <span className="whitespace-nowrap text-xs font-medium text-amber-600">
                    {t.products.lowStock.replace('{count}', product.stock)}
                  </span>
                )}
              </div>
            )}

            {/* Reviews */}
            <div className="mb-6 border-t border-ink/10 pt-5">
              <h3 className="font-display mb-3 text-lg font-semibold text-ink">
                {t.reviews.title}
              </h3>

              {(product.reviews || []).length === 0 ? (
                <p className="text-sm text-ink/40">{t.reviews.empty}</p>
              ) : (
                <ul className="space-y-3">
                  {product.reviews.map((review) => (
                    <li key={review.id} className="rounded-lg bg-surface p-3">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm font-medium text-ink">
                          {review.author || '—'}
                        </span>
                        <span className="inline-flex items-center gap-0.5 text-xs text-amber-600">
                          {Array.from({ length: review.rating }, (_, i) => (
                            <StarFill key={`f${i}`} className="h-3 w-3" />
                          ))}
                          <span className="inline-flex gap-0.5 text-ink/25">
                            {Array.from({ length: 5 - review.rating }, (_, i) => (
                              <Star key={`e${i}`} className="h-3 w-3" />
                            ))}
                          </span>
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-ink/60">{review.comment}</p>
                      )}
                      <p className="mt-1 text-[11px] text-ink/30">
                        {review.created_at}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Review form */}
            <div className="border-t border-ink/10 pt-5">
              <h3 className="font-display mb-3 text-lg font-semibold text-ink">
                {t.reviews.write}
              </h3>

              {notice && (
                <div className="mb-3 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-600">
                  {notice}
                </div>
              )}
              {error && (
                <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600">
                  {error}
                </div>
              )}

              {user ? (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <label className="mb-1 block text-sm text-ink/70">
                      {t.reviews.yourRating}
                    </label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setRating(n)}
                          className={`transition ${
                            n <= rating ? 'text-amber-600' : 'text-ink/25'
                          }`}
                          aria-label={`${n} star`}
                        >
                          {n <= rating ? (
                            <StarFill className="h-6 w-6" />
                          ) : (
                            <Star className="h-6 w-6" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={3}
                      maxLength={1000}
                      placeholder={t.reviews.placeholder}
                      className={inputClass}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-lg bg-accent py-2.5 text-sm font-medium text-white transition hover:bg-accent-hover disabled:opacity-50"
                  >
                    {submitting ? '...' : t.reviews.submit}
                  </button>
                </form>
              ) : (
                <div className="rounded-lg bg-surface p-4 text-center text-sm text-ink/60">
                  <p className="mb-3">{t.reviews.loginRequired}</p>
                  <Link
                    to="/login"
                    className="inline-block rounded-lg bg-accent px-5 py-2 text-sm font-medium text-white transition hover:bg-accent-hover"
                  >
                    {t.nav.login}
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
