const CACHE_NAME = 'archscript-v1';
const OFFLINE_URL = '/offline.html';

// Precache list: Core assets for offline experience
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/src/main.jsx',
  '/src/App.jsx',
  '/src/App.css',
  '/vite.svg',
  '/manifest.json'
];

// 1. Install Event: Precache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching offline assets');
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// 2. Activate Event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Fetch Event: Advanced Caching Strategy
self.addEventListener('fetch', (event) => {
  // Navigation requests: Network-first with offline fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.open(CACHE_NAME).then((cache) => {
          return cache.match(OFFLINE_URL);
        });
      })
    );
    return;
  }

  // Static assets: Cache-first, fall back to network
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((networkResponse) => {
        // Dynamically cache new static assets
        if (event.request.url.startsWith(self.location.origin) && 
            (event.request.destination === 'style' || event.request.destination === 'script' || event.request.destination === 'image')) {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        }
        return networkResponse;
      });
    })
  );
});
