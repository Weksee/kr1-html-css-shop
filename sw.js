// Service Worker: кэш оболочки сайта + работа без сети (PWA).
// Работает только по http(s) — на localhost или на хостинге, не с file://
const CACHE = 'weety-v1';
const SHELL = ['./', 'index.html', 'catalog.html', 'product.html', 'about.html', 'contacts.html', 'reviews.html', 'favorites.html', 'account.html',
  'css/style.css', 'js/data.js', 'js/main.js', 'manifest.webmanifest', 'icons/icon-192.png',
  'images/optimized/ferrari-sf90-640.webp', 'images/optimized/ferrari-sf90-1024.webp'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => Promise.allSettled(SHELL.map((url) => cache.add(url)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (req.mode === 'navigate') {
    // Страницы: сначала сеть, при отсутствии интернета — кэш
    event.respondWith(fetch(req).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res; })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match('index.html'))));
    return;
  }
  // Статика: из кэша сразу, в фоне обновляем
  event.respondWith(caches.match(req).then((cached) => {
    const network = fetch(req).then((res) => { if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); } return res; }).catch(() => cached);
    return cached || network;
  }));
});
