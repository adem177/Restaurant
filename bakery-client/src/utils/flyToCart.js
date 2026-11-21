/**
 * Launch a fork-and-knife glyph from a button that flies in an arc up to the
 * cart icon and bumps it with a floating "+1". Pure DOM + Web Animations API,
 * no dependency.
 *
 * Targets the first element marked `data-fly-cart` (the navbar cart link, or the
 * sticky cart bar on the QR menu). Does nothing when no cart is on screen, and
 * honours the user's reduced-motion preference.
 *
 * @param {HTMLElement|null} sourceEl The button the glyph launches from.
 * @param {(() => void) [onDone] Called once the glyph lands (or immediately
 *   when the flight is skipped), e.g. to slide the cart drawer open.
 */
export function flyToCart(sourceEl, onDone) {
  const target = document.querySelector('[data-fly-cart]')
  if (!target) {
    onDone?.()
    return
  }

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const dest = target.getBoundingClientRect()
  const source = sourceEl?.getBoundingClientRect()

  if (source && !reduced) {
    const startX = source.left + source.width / 2
    const startY = source.top + source.height / 2
    const endX = dest.left + dest.width / 2
    const endY = dest.top + dest.height / 2
    // Peak of the arc, lifted above the straight line between the two points.
    const midX = (startX + endX) / 2
    const midY = Math.min(startY, endY) - 100

    const flyer = document.createElement('div')
    flyer.setAttribute('aria-hidden', 'true')
    flyer.style.cssText =
      'position:fixed;left:0;top:0;z-index:9999;pointer-events:none;line-height:1;will-change:transform,opacity;'
    // Bootstrap "fork-knife" glyph as raw SVG (this util is plain DOM, not JSX).
    flyer.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 16 16" fill="#f59e0b">' +
      '<path d="M13 .5c0-.276-.226-.506-.498-.465-1.703.257-2.94 2.012-3 8.462a.5.5 0 0 0 .498.5c.56.01 1 .13 1 1.003v5.5a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5zM4.25 0a.25.25 0 0 1 .25.25v5.122a.128.128 0 0 0 .256.006l.233-5.14A.25.25 0 0 1 5.24 0h.522a.25.25 0 0 1 .25.238l.233 5.14a.128.128 0 0 0 .256-.006V.25A.25.25 0 0 1 6.75 0h.29a.5.5 0 0 1 .498.458l.423 5.07a1.69 1.69 0 0 1-1.059 1.711l-.053.022a.92.92 0 0 0-.58.884L6.47 15a.971.971 0 1 1-1.942 0l.202-6.855a.92.92 0 0 0-.58-.884l-.053-.022a1.69 1.69 0 0 1-1.059-1.712L3.462.458A.5.5 0 0 1 3.96 0z"/>' +
      '</svg>'
    document.body.appendChild(flyer)

    const at = (x, y, scale, opacity) => ({
      transform: `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${scale})`,
      opacity,
    })

    const anim = flyer.animate(
      [at(startX, startY, 0.6, 1), at(midX, midY, 1.2, 1), at(endX, endY, 0.4, 0)],
      { duration: 1600, easing: 'cubic-bezier(0.34, 0.6, 0.28, 1)' },
    )
    anim.addEventListener('finish', () => {
      flyer.remove()
      bumpCart()
      onDone?.()
    })
    // Safety: never leave the clone behind if the animation is interrupted.
    anim.addEventListener('cancel', () => {
      flyer.remove()
      onDone?.()
    })
  } else {
    bumpCart()
    onDone?.()
  }
}

/** Pop a "+1" over the cart and give it a quick pulse. */
function bumpCart() {
  const target = document.querySelector('[data-fly-cart]')
  if (!target) return
  const rect = target.getBoundingClientRect()

  const badge = document.createElement('span')
  badge.textContent = '+1'
  badge.setAttribute('aria-hidden', 'true')
  badge.style.cssText = `position:fixed;left:${rect.left + rect.width / 2}px;top:${rect.top}px;z-index:9999;pointer-events:none;color:#4ade80;font-weight:700;font-size:12px;line-height:1;text-shadow:0 1px 2px rgba(0,0,0,0.6);`
  document.body.appendChild(badge)
  badge
    .animate(
      [
        { transform: 'translate(-50%, -100%) scale(0.6)', opacity: 0 },
        { transform: 'translate(-50%, -130%) scale(1.1)', opacity: 1, offset: 0.4 },
        { transform: 'translate(-50%, -180%) scale(1)', opacity: 0 },
      ],
      { duration: 750, easing: 'ease-out' },
    )
    .addEventListener('finish', () => badge.remove())

  target.animate(
    [{ transform: 'scale(1)' }, { transform: 'scale(1.3)' }, { transform: 'scale(1)' }],
    { duration: 380, easing: 'ease-out' },
  )
}
