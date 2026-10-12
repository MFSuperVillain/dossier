// Minimal service worker: lets Android Chrome install Dossier as an app (which
// is what puts it in the Share sheet). Network-first, falls back to cache.
const CACHE = 'dossier-v1'
self.addEventListener('install', (e) => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))
self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone()
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {})
        return res
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match('./')))
  )
})
