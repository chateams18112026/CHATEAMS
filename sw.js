const CACHE_NAME = 'chateams-prod-v2300';
const SHARE_CACHE = 'chateams-share-target';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './version.json',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
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
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== SHARE_CACHE) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAR_AND_UPDATE') {
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== SHARE_CACHE).map(k => caches.delete(k)))
    ).then(() => {
      if (event.source) event.source.postMessage({ type: 'CHATEAMS_CACHE_CLEARED' });
    });
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'chateams-outbox-sync') {
    event.waitUntil(
      self.clients.matchAll({ includeUncontrolled: true }).then((clientList) => {
        clientList.forEach((client) => client.postMessage({ type: 'CHATEAMS_BG_SYNC' }));
      })
    );
  }
});

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'chateams-periodic-sync') {
    event.waitUntil(
      self.clients.matchAll({ includeUncontrolled: true }).then((clientList) => {
        clientList.forEach((client) => client.postMessage({ type: 'CHATEAMS_BG_SYNC' }));
      })
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        const client = clientList[0];
        client.postMessage({ type: 'CHATEAMS_NOTIF_ACTION', action: event.action || 'open' });
        return client.focus();
      }
      return self.clients.openWindow('./index.html');
    })
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (event.request.method === 'POST' && url.searchParams.get('share_target') === '1') {
    event.respondWith((async () => {
      try {
        const formData = await event.request.formData();
        const mediaFiles = formData.getAll('media');
        const cache = await caches.open(SHARE_CACHE);
        const oldKeys = await cache.keys();
        await Promise.all(oldKeys.map((k) => cache.delete(k)));
        let idx = 0;
        for (const file of mediaFiles) {
          if (file && file.size > 0) {
            const safeName = encodeURIComponent(file.name || ('shared-' + idx));
            await cache.put(
              new Request('./__shared__/' + (idx++) + '_' + safeName),
              new Response(file, { headers: { 'Content-Type': file.type || 'application/octet-stream' } })
            );
          }
        }
      } catch (err) {}
      return Response.redirect('./index.html?share_target=1', 303);
    })());
    return;
  }

  if (event.request.method !== 'GET') return;

  // Network-first for HTML and version.json so GitHub updates always show immediately!
  if (url.pathname.endsWith('/') || url.pathname.endsWith('.html') || url.pathname.endsWith('version.json')) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, clone)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(event.request).then((r) => r || caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) =>
      cached || fetch(event.request).catch(() => caches.match('./index.html'))
    )
  );
});
