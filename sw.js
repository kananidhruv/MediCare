// ============================================================
// MediCare PWA Service Worker
// Caches all app assets for offline use
// ============================================================

const CACHE_NAME = 'medicare-v1';

// All files to cache for offline access
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// ---- INSTALL: cache all assets ----
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching app shell');
      // Cache local assets; skip external fonts if they fail
      return Promise.allSettled(
        ASSETS.map(url => cache.add(url).catch(() => console.warn('[SW] Failed to cache:', url)))
      );
    })
  );
  self.skipWaiting();
});

// ---- ACTIVATE: remove old caches ----
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ---- FETCH: serve from cache, fallback to network ----
self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      // Not in cache → fetch from network and cache dynamically
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        return response;
      }).catch(() => {
        // If offline and not cached, return the main app page
        return caches.match('/index.html');
      });
    })
  );
});
