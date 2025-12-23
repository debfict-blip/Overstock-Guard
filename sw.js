const CACHE_NAME = 'kitchen-guard-v1';
// Use relative paths (no leading slash) so it works on GitHub Pages subfolders
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // We use map to catch individual errors so one missing file doesn't break the whole app
      return Promise.all(
        ASSETS.map(url => {
          return cache.add(url).catch(err => console.log('Failed to cache:', url, err));
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});