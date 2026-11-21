/**
 * Maps a product image filename to a usable URL.
 * Falls back to a curated restaurant photo when no image is set.
 */
const FALLBACKS = [
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80',
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80',
]

let fallbackIndex = 0

export function productImage(filename) {
  if (!filename) {
    return FALLBACKS[fallbackIndex++ % FALLBACKS.length]
  }
  if (filename.startsWith('http')) {
    return filename
  }
  return `/images/products/${filename}`
}

export function categoryImage(slug) {
  const map = {
    starters: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
    mains: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
    desserts: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=80',
  }
  return map[slug] || FALLBACKS[0]
}

/**
 * Ask Unsplash for a modern format at a given width.
 * Non-Unsplash URLs are returned untouched.
 */
function unsplashWidth(url, width) {
  if (!url.startsWith('https://images.unsplash.com/')) {
    return url
  }

  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}w=${width}&fm=webp&fit=crop`
}

/**
 * A `src` plus a `srcset` tuned to the card size, so a phone does not
 * download the 1200px asset for a 300px thumbnail.
 */
export function imageSources(url) {
  const src = unsplashWidth(url, 600)
  const srcset = unsplashWidth(url, 300)

  return url.startsWith('https://images.unsplash.com/')
    ? { src, srcSet: `${srcset} 300w, ${src} 600w, ${unsplashWidth(url, 900)} 900w` }
    : { src, srcSet: undefined }
}
