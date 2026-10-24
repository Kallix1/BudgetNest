const CACHE_NAME = 'budgetnest-v1';
const ASSETS = [
  './',
  './dashboard.html',
  './transactions.html',
  './budgets.html',
  './wallets.html',
  './goals.html',
  './recurring.html',
  './settle.html',
  './reviews.html',
  './settings.html',
  './login.html',
  './css/style.css',
  './css/dashboard.css',
  './css/datepicker.css',
  './nav.js',
  './i18n.js',
  './analytics.js',
  './icons.js',
  './datepicker.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).catch(() => cached);
    })
  );
});
