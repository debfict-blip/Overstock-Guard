
const CACHE_NAME = 'kitchen-guard-v1.1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './index.tsx'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        ASSETS.map(url => {
          return cache.add(url).catch(err => console.warn('Failed to cache during install:', url));
        })
      );
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Network first strategy for the main logic to ensure updates on GitHub Pages
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
