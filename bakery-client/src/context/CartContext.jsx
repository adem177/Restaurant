import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const CartContext = createContext(null)

/**
 * One cart line is identified by the product AND the options picked on it,
 * so a large latte and a small latte stay on two separate lines.
 */
export const cartKey = (productId, options = []) =>
  `${productId}:${(options || []).map((o) => o.id).sort((a, b) => a - b).join(',')}`

/** Total price of one unit: base price plus every selected option delta. */
const unitPrice = (product, options = []) =>
  parseFloat(product.price) +
  (options || []).reduce((sum, option) => sum + parseFloat(option.price_delta || 0), 0)

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('cart')) || []
      // Carts saved before options existed only carry a product id.
      return stored.map((item) =>
        item.key ? item : { ...item, options: [], key: cartKey(item.id, []) },
      )
    } catch {
      return []
    }
  })

  // Slide-in cart drawer visibility (Navbar).
  const [cartOpen, setCartOpen] = useState(false)

  // Open only if a drawer is actually mounted (e.g. skip on the standalone QR
  // menu, which has no drawer) so state never gets stuck "open" off-screen.
  const openCart = useCallback(() => {
    if (document.querySelector('[data-cart-drawer]')) setCartOpen(true)
  }, [])

  const closeCart = useCallback(() => setCartOpen(false), [])

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items))
  }, [items])

  const addItem = (product, options = [], quantity = 1) => {
    const key = cartKey(product.id, options)

    setItems((current) => {
      const existing = current.find((item) => item.key === key)
      if (existing) {
        return current.map((item) =>
          item.key === key ? { ...item, quantity: item.quantity + quantity } : item,
        )
      }
      return [
        ...current,
        {
          key,
          id: product.id,
          name_fr: product.name_fr,
          name_en: product.name_en,
          name_ar: product.name_ar,
          image: product.image,
          options: options || [],
          // Unit price, option deltas included.
          price: unitPrice(product, options),
          quantity,
        },
      ]
    })
  }

  const removeItem = (key) => {
    setItems((current) => current.filter((item) => item.key !== key))
  }

  const updateQuantity = (key, quantity) => {
    if (quantity < 1) {
      removeItem(key)
      return
    }
    setItems((current) =>
      current.map((item) => (item.key === key ? { ...item, quantity } : item)),
    )
  }

  const clearCart = () => setItems([])

  const total = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + parseFloat(item.price) * item.quantity,
        0,
      ),
    [items],
  )

  const count = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  )

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        total,
        count,
        cartOpen,
        openCart,
        closeCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}
