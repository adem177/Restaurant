import { Link } from 'react-router-dom'
import { Trash3 } from 'react-bootstrap-icons'
import { useCart } from '../context/CartContext'
import { useLanguage } from '../context/LanguageContext'
import { localizedName } from '../utils/localize'

export default function Cart() {
  const { t, lang } = useLanguage()
  const { items, updateQuantity, removeItem, total, clearCart } = useCart()

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-4xl px-6 pb-20 pt-32 text-center">
        <h1 className="font-display mb-4 text-4xl font-bold italic text-ink">
          {t.cart.title}
        </h1>
        <p className="mb-8 text-ink/50">{t.cart.empty}</p>
        <Link
          to="/menu"
          className="inline-block rounded-lg bg-accent px-6 py-3 text-sm font-medium text-white transition hover:bg-accent-hover"
        >
          {t.cart.continue}
        </Link>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-4xl px-6 pb-20 pt-32">
      <h1 className="font-display mb-8 text-4xl font-bold italic text-ink">
        {t.cart.title}
      </h1>

      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.key}
            className="flex items-center gap-4 rounded-xl bg-surface p-4"
          >
            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
              <img
                src={item.image?.startsWith('http') ? item.image : 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&q=80'}
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
                          {' '}
                          +{parseFloat(option.price_delta).toFixed(2)}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-0.5 text-sm text-ink/60">{parseFloat(item.price).toFixed(2)} DT</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuantity(item.key, item.quantity - 1)}
                className="flex h-7 w-7 items-center justify-center rounded bg-ivory text-ink transition hover:bg-accent"
              >
                −
              </button>
              <span className="w-6 text-center text-sm text-ink">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.key, item.quantity + 1)}
                className="flex h-7 w-7 items-center justify-center rounded bg-ivory text-ink transition hover:bg-accent"
              >
                +
              </button>
            </div>
            <p className="w-20 text-right text-sm font-semibold text-ink">
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
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between rounded-xl bg-surface p-6">
        <div>
          <p className="text-sm text-ink/60">{t.cart.total}</p>
          <p className="font-display text-2xl font-bold text-ink">
            {total.toFixed(2)} DT
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={clearCart}
            className="rounded-lg border border-ink/20 px-4 py-2 text-sm text-ink/70 transition hover:border-red-400 hover:text-red-600"
            aria-label={t.cart.clear}
          >
            <Trash3 className="h-4 w-4" />
          </button>
          <Link
            to="/checkout"
            className="rounded-lg bg-accent px-6 py-3 text-sm font-medium text-white transition hover:bg-accent-hover"
          >
            {t.cart.checkout}
          </Link>
        </div>
      </div>
    </section>
  )
}
