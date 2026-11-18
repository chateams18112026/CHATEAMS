const CACHE_NAME = 'chateams-v5';
const SHARE_CACHE = 'chateams-share-target';
const ASSETS = ['./', './index.html', './manifest.json', './icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME && k !== SHARE_CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Background Sync for Outbox Queue on Weak/Restored Network
self.addEventListener('sync', (event) => {
  if (event.tag === 'chateams-outbox-sync') {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cls) => {
        cls.forEach((c) => c.postMessage({ type: 'CHATEAMS_BG_SYNC' }));
      })
    );
  }
});

// Periodic Background Keep-Alive Poll
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'chateams-bg-poll') {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cls) => {
        cls.forEach((c) => c.postMessage({ type: 'CHATEAMS_BG_SYNC' }));
      })
    );
  }
});

// Background Push Notifications when app is closed
self.addEventListener('push', (event) => {
  let data = { title: 'CHATEAMS', body: 'New message', type: 'message', mode: 'voice', roomId: 'priya' };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch (e) {}

  if (data.type === 'incoming_call') {
    event.waitUntil(
      self.registration.showNotification(`Incoming ${data.mode === 'video' ? 'Video' : 'Voice'} Call · ${data.title}`, {
        body: 'Tap Answer to join full-screen call',
        icon: './icon.svg',
        badge: './icon.svg',
        tag: `chateams-call-${data.roomId}`,
        renotify: true,
        requireInteraction: true,
        vibrate: [300, 150, 300, 150, 300],
        data,
        actions: [
          { action: 'accept_call', title: '📞 Answer' },
          { action: 'decline_call', title: '✖ Decline' }
        ]
      })
    );
    return;
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: './icon.svg',
      badge: './icon.svg',
      tag: `chateams-msg-${data.roomId}`,
      renotify: true,
      data,
      actions: [
        { action: 'reply', title: '↩ Reply' },
        { action: 'read', title: '✓ Mark Read' }
      ]
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const action = event.action;
  const info = event.notification.data || {};
  if (action === 'decline_call' || action === 'read') return;

  const targetUrl = info.type === 'incoming_call'
    ? `./index.html?incoming_call=1&mode=${encodeURIComponent(info.mode || 'voice')}&room=${encodeURIComponent(info.roomId || 'priya')}`
    : `./index.html?room=${encodeURIComponent(info.roomId || '')}`;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});

// Cache-first / Network-fallback so app opens & works reliably even on 2G/Offline
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method === 'POST' && url.searchParams.get('share_target') === '1') {
    event.respondWith((async () => {
      try {
        const formData = await event.request.formData();
        const files = formData.getAll('media');
        const cache = await caches.open(SHARE_CACHE);
        let idx = 0;
        for (const file of files) {
          if (file && typeof file.arrayBuffer === 'function') {
            const safeName = encodeURIComponent(file.name || `shared-${idx++}`);
            await cache.put(`./shared-temp/${idx}-${safeName}`, new Response(file, {
              headers: { 'Content-Type': file.type || 'application/octet-stream' }
            }));
          }
        }
      } catch (e) {}
      return Response.redirect('./index.html?share_target=1', 303);
    })());
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
