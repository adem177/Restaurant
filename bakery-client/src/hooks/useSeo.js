import { useEffect } from 'react'

const SITE_NAME = 'Happy Plate'
const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80'

/** Create a meta tag if it is missing, otherwise update it in place. */
function upsertMeta(attribute, key, content) {
  if (!content) return
  let tag = document.head.querySelector(`meta[${attribute}="${key}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attribute, key)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

/**
 * Sets the document title and the social/meta tags for the current page.
 * Call it from a page component; it re-runs whenever the values change.
 */
export default function useSeo({ title, description, path, image }) {
  const fullTitle = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — Cuisine internationale, faite avec amour`
  const descriptionText =
    description ||
    'Restaurant de cuisine internationale. Entrées, plats et desserts préparés frais chaque jour.'
  const imageUrl = image || DEFAULT_IMAGE
  // Keep the deployed origin so tags stay valid on any host.
  const url = typeof window === 'undefined' ? path : new URL(path || '/', window.location.origin).href

  useEffect(() => {
    document.title = fullTitle

    upsertMeta('name', 'description', descriptionText)
    upsertMeta('property', 'og:title', fullTitle)
    upsertMeta('property', 'og:description', descriptionText)
    upsertMeta('property', 'og:image', imageUrl)
    upsertMeta('property', 'og:url', url)
    upsertMeta('name', 'twitter:title', fullTitle)
    upsertMeta('name', 'twitter:description', descriptionText)
    upsertMeta('name', 'twitter:image', imageUrl)

    let canonical = document.head.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }
    canonical.setAttribute('href', url)
  }, [fullTitle, descriptionText, imageUrl, url])
}
