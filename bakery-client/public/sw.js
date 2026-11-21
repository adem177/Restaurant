/**
 * Happy Plate service worker.
 *
 * A hand-written worker (no build plugin) that keeps the restaurant usable offline:
 * the app shell is precached, hashed assets are served from cache, and the
 * public catalogue (products, categories) plus images are kept so the QR menu
 * still works at a table with no signal.
 *
 * Nothing that mutates data is ever cached: no POST/PATCH/DELETE, and no
 * request carrying an Authorization header.
 */

const VERSION = 'v1'
const SHELL_CACHE = `happyplate-shell-${VERSION}`
const ASSET_CACHE = `happyplate-assets-${VERSION}`
const DATA_CACHE = `happyplate-data-${VERSION}`
const IMAGE_CACHE = `happyplate-images-${VERSION}`
const KNOWN_CACHES = [SHELL_CACHE, ASSET_CACHE, DATA_CACHE, IMAGE_CACHE]

const SHELL = ['/', '/offline.html', '/manifest.webmanifest', '/icon.svg']

/** Public, read-only endpoints worth keeping for offline menu browsing. */
const DATA_PATHS = ['/api/categories', '/api/allergens', '/api/products']

/**
 * Keep the image cache bounded: photos are the only unbounded stream, so trim
 * the oldest entries once the cap is passed.
 */
const MAX_IMAGE_ENTRIES = 120

const isMutableMethod = (request) =>
  request.method !== 'GET' || request.headers.has('authorization')

/**
 * install: precache the shell so a first launch already survives offline.
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  )
})

/**
 * activate: drop caches from older versions, then take control immediately.
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !KNOWN_CACHES.includes(key))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  // Never intercept non-GET or authenticated traffic.
  if (isMutableMethod(request)) {
    return
  }

  const url = new URL(request.url)

  // Cross-origin (fonts, Unsplash photos) is only ever an image or a font.
  if (url.origin !== self.location.origin) {
    if (request.destination === 'image' || request.destination === 'font') {
      event.respondWith(cacheFirst(request, IMAGE_CACHE))
    }
    return
  }

  // SPA navigation: network first, fall back to the cached shell, then offline.
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request))
    return
  }

  // Hashed build output never changes for a given URL.
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(request, ASSET_CACHE))
    return
  }

  if (request.destination === 'image') {
    event.respondWith(cacheFirst(request, IMAGE_CACHE))
    return
  }

  // Public catalogue: refresh in the background, answer from cache offline.
  if (url.pathname.startsWith('/api/')) {
    if (DATA_PATHS.some((path) => url.pathname === path || url.pathname.startsWith(`${path}?`))) {
      event.respondWith(staleWhileRevalidate(request, DATA_CACHE))
    }
    // Any other API call (auth, orders, admin) goes straight to the network.
  }
})

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request)
  if (cached) {
    return cached
  }

  try {
    const response = await fetch(request)
    if (isCacheable(response)) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
      if (cacheName === IMAGE_CACHE) {
        await trimCache(cacheName, MAX_IMAGE_ENTRIES)
      }
    }
    return response
  } catch (error) {
    // An image that never made it into the cache is simply missing offline.
    return Response.error()
  }
}

/** Drop the oldest entries once a cache grows past `maxEntries`. */
async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()

  for (const key of keys.slice(0, Math.max(0, keys.length - maxEntries))) {
    await cache.delete(key)
  }
}

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request)
    if (isCacheable(response)) {
      const cache = await caches.open(SHELL_CACHE)
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    // Only answer with a page we actually hold. A never-visited route would
    // come back as the shell but then fail to load its own chunks, so show
    // the offline notice instead of a blank screen.
    const cached = await caches.match(request)
    if (cached) {
      return cached
    }

    const offline = await caches.match('/offline.html')
    return offline || Response.error()
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)

  const refresh = fetch(request)
    .then((response) => {
      if (isCacheable(response)) {
        cache.put(request, response.clone())
      }
      return response
    })
    .catch(() => null)

  // Answer instantly from cache when we have it, otherwise wait for network.
  return cached || (await refresh) || Response.error()
}

function isCacheable(response) {
  return response && response.ok && response.status === 200 && response.type !== 'opaque'
}
