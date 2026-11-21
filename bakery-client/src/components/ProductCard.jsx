import { useState } from 'react'
import { Leaf } from 'react-bootstrap-icons'
import { useCart } from '../context/CartContext'
import { useLanguage } from '../context/LanguageContext'
import { productImage, imageSources } from '../utils/images'
import { localizedName } from '../utils/localize'
import ProductModal from './ProductModal'
import Stars from './Stars'
import { flyToCart } from '../utils/flyToCart'

export default function ProductCard({ product }) {
  const { t, lang } = useLanguage()
  const { addItem, openCart } = useCart()
  const [added, setAdded] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const name = localizedName(product, lang)
  const soldOut = product.in_stock === false
  const lowStock =
    product.stock !== null && product.stock > 0 && product.stock <= 5
  // A required size (or any required group) needs the modal before adding.
  const hasRequiredOptions = (product.option_groups || []).some((g) => g.is_required)

  const handleAdd = (e) => {
    if (soldOut) return
    if (hasRequiredOptions) {
      setShowModal(true)
      return
    }
    const btn = e.currentTarget
    addItem(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 1200)
    flyToCart(btn, openCart)
  }

  return (
    <div className="group relative overflow-hidden rounded-xl bg-surface shadow-lg transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative h-44 overflow-hidden">
        <img
          src={imageSources(productImage(product.image)).src}
          srcSet={imageSources(productImage(product.image)).srcSet}
          sizes="(max-width: 768px) 50vw, 300px"
          alt={name}
          width="600"
          height="440"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
          loading="lazy"
          decoding="async"
        />
        {product.is_gluten_free && (
          <span className="absolute left-2 top-2 rounded-full bg-green-600/90 px-2 py-0.5 text-[10px] font-semibold text-white">
            GF
          </span>
        )}
        {product.is_vegetarian && !product.is_gluten_free && (
          <span className="absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-green-800/80 text-white">
            <Leaf className="h-3 w-3" />
          </span>
        )}
        {soldOut && (
          <span className="absolute left-2 top-2 rounded-full bg-red-600/90 px-2 py-0.5 text-[10px] font-semibold text-white">
            {t.products.soldOut}
          </span>
        )}
        <button
          onClick={() => setShowModal(true)}
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-ivory/70 text-sm text-ink transition hover:bg-accent"
          aria-label="info"
        >
          i
        </button>
      </div>

      <div className="p-4">
        <p className="mb-1 text-sm font-semibold text-ink">{parseFloat(product.price).toFixed(2)} DT</p>
        <button
          onClick={() => setShowModal(true)}
          className="mb-1 block w-full text-left"
        >
          <h3 className="line-clamp-1 text-sm text-ink/70 hover:text-accent">{name}</h3>
        </button>
        <div className="mb-3">
          <Stars value={product.rating_avg} count={product.reviews_count} size="text-xs" />
        </div>
        {lowStock && (
          <p className="mb-2 text-[11px] font-medium text-amber-600">
            {t.products.lowStock.replace('{count}', product.stock)}
          </p>
        )}
        <button
          onClick={handleAdd}
          disabled={soldOut}
          className={`w-full rounded-lg px-4 py-2 text-sm font-medium transition ${
            soldOut
              ? 'cursor-not-allowed bg-ivory text-ink/40'
              : added
                ? 'bg-green-600 text-white ring-1 ring-green-400/40'
                : 'bg-accent text-white hover:bg-accent-hover'
          }`}
        >
          {soldOut ? t.products.soldOut : added ? t.products.added : t.products.add}
        </button>
      </div>

      {showModal && (
        <ProductModal productId={product.id} onClose={() => setShowModal(false)} />
      )}
    </div>
  )
}
