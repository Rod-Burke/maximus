const CACHE_NAME = 'maximus-v41';
const ASSETS = ['index.html', 'style.css', 'app.js', 'manifest.json', 'icon.svg', 'migration.html', 'migration.js'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.url.includes('supabase.co')) { e.respondWith(fetch(e.request)); return; }
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
