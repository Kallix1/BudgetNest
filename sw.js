const CACHE_NAME = 'budgetnest-v3';
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
  './theme.js',
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

  // Мрежа първо: така след обновяване на сайта потребителите не остават със
  // стар кеширан HTML/JS. При офлайн връщаме кеширано копие, а за навигация —
  // таблото, което е предварително кеширано.
  event.respondWith((async () => {
    try {
      const response = await fetch(event.request);
      if (response && response.ok) {
        try {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(event.request, response.clone());
        } catch (cacheError) {
          // Кеширането е второстепенно — не проваляме заявката заради него.
        }
      }
      return response;
    } catch (networkError) {
      const cached = await caches.match(event.request);
      if (cached) return cached;

      if (event.request.mode === 'navigate') {
        const fallback = await caches.match('./dashboard.html');
        if (fallback) return fallback;
      }

      // Винаги връщаме валиден Response — иначе respondWith(null) хвърля
      // TypeError и заявката приключва с неясна мрежова грешка.
      return new Response('', {
        status: 503,
        statusText: 'Offline',
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }
  })());
});
