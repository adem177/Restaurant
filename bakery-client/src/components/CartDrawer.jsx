import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { XLg, Trash3 } from 'react-bootstrap-icons'
import { useCart } from '../context/CartContext'
import { useLanguage } from '../context/LanguageContext'
import { localizedName } from '../utils/localize'

/**
 * Slide-in cart drawer, opened from the navbar cart icon.
 *
 * Reuses the CartContext so it stays in sync with the full /cart page.
 * It slides from the right (left in RTL), closes on overlay click, the close
 * button or the Escape key, and locks body scroll while open.
 */
export default function CartDrawer({ open, onClose }) {
  const { t, lang } = useLanguage()
  const { items, updateQuantity, removeItem, total, clearCart } = useCart()
  const navigate = useNavigate()
  const rtl = lang === 'ar'

  // Close on Escape and lock scroll while open.
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  const goToCheckout = () => {
    onClose()
    navigate('/checkout')
  }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Drawer panel */}
      <aside
        data-cart-drawer
        role="dialog"
        aria-modal="true"
        aria-label={t.cart.title}
        className={`fixed inset-y-0 z-50 flex w-full max-w-sm flex-col bg-ivory shadow-2xl transition-transform duration-300 ${
          rtl ? 'left-0' : 'right-0'
        } ${open ? 'translate-x-0' : rtl ? '-translate-x-full' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
          <h2 className="font-display text-xl font-bold text-ink">{t.cart.title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-ink/10 text-ink transition hover:bg-accent hover:text-white"
          >
            <XLg className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        {items.length === 0 ? (
          <div className="flex flex-1 items-center justify-center px-6 text-center">
            <p className="text-ink/50">{t.cart.empty}</p>
          </div>
        ) : (
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
            {items.map((item) => (
              <div key={item.key} className="flex items-start gap-3">
                <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
                  <img
                    src={
                      item.image?.startsWith('http')
                        ? item.image
                        : 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&q=80'
                    }
                    alt={localizedName(item, lang)}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-ink">
                    {localizedName(item, lang)}
                  </h3>
                  {(item.options || []).length > 0 && (
                    <ul className="mt-1 space-y-0.5">
                      {item.options.map((option) => (
                        <li key={option.id} className="text-xs text-amber-600/80">
                          {localizedName(option, lang)}
                          {parseFloat(option.price_delta) > 0 && (
                            <span className="text-ink/40">
                              {' '}+{parseFloat(option.price_delta).toFixed(2)}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="mt-0.5 text-sm text-ink/60">
                    {parseFloat(item.price).toFixed(2)} DT
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.key, item.quantity - 1)}
                      className="flex h-7 w-7 items-center justify-center rounded bg-surface text-ink transition hover:bg-accent"
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-sm text-ink">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.key, item.quantity + 1)}
                      className="flex h-7 w-7 items-center justify-center rounded bg-surface text-ink transition hover:bg-accent"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <p className="text-sm font-semibold text-ink">
                    {(parseFloat(item.price) * item.quantity).toFixed(2)} DT
                  </p>
                  <button
                    onClick={() => removeItem(item.key)}
                    className="text-ink/40 transition hover:text-red-600"
                    aria-label={t.cart.remove}
                  >
                    <Trash3 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-ink/10 px-5 py-4">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-ink/60">{t.cart.total}</span>
            <span className="font-display text-2xl font-bold text-accent">
              {total.toFixed(2)} DT
            </span>
          </div>
          <button
            onClick={goToCheckout}
            disabled={items.length === 0}
            className={`w-full rounded-full px-6 py-3 text-sm font-semibold text-white transition ${
              items.length === 0
                ? 'cursor-not-allowed bg-ink/10 text-ink/40'
                : 'bg-accent hover:bg-accent-hover'
            }`}
          >
            {t.cart.checkout}
          </button>
          <button
            onClick={clearCart}
            disabled={items.length === 0}
            className="mt-3 w-full rounded-full border border-accent px-6 py-3 text-sm font-semibold text-accent transition hover:bg-accent/10 disabled:cursor-not-allowed disabled:border-ink/15 disabled:text-ink/30"
          >
            {t.cart.clear}
          </button>
        </div>
      </aside>
    </>
  )
}
