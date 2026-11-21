import { useEffect } from 'react'

const STRENGTH = 0.28 // how strongly an element follows the cursor
const MAX_SHIFT = 10 // px — keeps wide/full-width buttons tasteful
const FOLLOW =
  'transform 120ms ease-out, border-color 300ms ease, color 300ms ease, box-shadow 300ms ease'
const SETTLE =
  'transform 550ms cubic-bezier(0.34, 1.56, 0.64, 1), border-color 300ms ease, color 300ms ease, box-shadow 300ms ease'
const CLEAR_DELAY = 560 // slightly longer than SETTLE

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

/**
 * Site-wide magnetic effect: every <button> and every rounded CTA link leans
 * toward the cursor on hover and springs back when the pointer leaves.
 *
 * Uses a single pair of delegated listeners instead of wiring each button,
 * so dynamically rendered pages (admin, cart, tabs...) are covered too.
 * Opt out per element with `data-no-magnet`.
 */
export default function MagneticFX() {
  useEffect(() => {
    // Touch devices have no hover: skip entirely.
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return

    let active = null
    const pendingClears = new Map()

    const clearInlineStyles = (el) => {
      el.style.removeProperty('transform')
      el.style.removeProperty('transition')
      pendingClears.delete(el)
    }

    const scheduleClear = (el) => {
      window.clearTimeout(pendingClears.get(el))
      pendingClears.set(
        el,
        window.setTimeout(() => clearInlineStyles(el), CLEAR_DELAY),
      )
    }

    const release = () => {
      if (!active) return
      const el = active
      active = null
      el.style.transition = SETTLE
      el.style.transform = 'translate(0px, 0px)'
      scheduleClear(el)
    }

    const resolveTarget = (target) => {
      if (!(target instanceof Element)) return null
      const el = target.closest('button, a')
      if (!el || el.disabled) return null
      if (el.hasAttribute('data-no-magnet')) return null
      // Plain text links (nav, footer) stay still; only rounded CTAs magnet.
      if (el.tagName === 'A' && !/\brounded/.test(el.className)) return null
      return el
    }

    const handleMove = (event) => {
      const el = resolveTarget(event.target)

      if (!el) {
        release()
        return
      }

      if (el !== active) {
        release()
        active = el
        // Re-entered before the settle finished: keep our own styles.
        window.clearTimeout(pendingClears.get(el))
        pendingClears.delete(el)
      }

      const rect = el.getBoundingClientRect()
      const x = clamp(
        (event.clientX - rect.left - rect.width / 2) * STRENGTH,
        -MAX_SHIFT,
        MAX_SHIFT,
      )
      const y = clamp(
        (event.clientY - rect.top - rect.height / 2) * STRENGTH,
        -MAX_SHIFT,
        MAX_SHIFT,
      )

      el.style.transition = FOLLOW
      el.style.transform = `translate(${x}px, ${y}px)`
    }

    const handleLeaveWindow = () => release()

    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseleave', handleLeaveWindow)

    return () => {
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseleave', handleLeaveWindow)
      pendingClears.forEach((timer) => window.clearTimeout(timer))
      pendingClears.clear()
      if (active) clearInlineStyles(active)
    }
  }, [])

  return null
}
