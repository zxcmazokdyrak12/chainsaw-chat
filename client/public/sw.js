// Chainsaw Chat service worker: an offline shell + push notifications.
// The chat itself always talks to the server live; only the app's own files are cached.
const CACHE = 'csm-shell-v1'
const SHELL = ['/', '/manifest.webmanifest', '/icon-192.png', '/app-icon.svg']

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()))
})
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()))
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  const url = new URL(req.url)
  if (req.method !== 'GET' || url.origin !== self.location.origin) return // the API and uploads are never cached here
  // pages: network first, the cached shell when offline
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { caches.open(CACHE).then(c => c.put('/', r.clone())); return r }).catch(() => caches.match('/')))
    return
  }
  // hashed build files, fonts and artwork never change under the same name: cache first
  if (/^\/(assets|fonts|stickers|reactions|avatars)\//.test(url.pathname) || /\.(png|webp|jpg|svg|woff2?|ttf|otf|mp3)$/.test(url.pathname)) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
      if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)) }
      return r
    })))
  }
})

// a push from the server: { title, body, roomId, tag }
self.addEventListener('push', (e) => {
  let data = {}
  try { data = e.data ? e.data.json() : {} } catch { data = { title: 'Chainsaw Chat', body: e.data ? e.data.text() : '' } }
  e.waitUntil(self.registration.showNotification(data.title || 'Chainsaw Chat', {
    body: data.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || 'chainsaw-chat',
    renotify: true,
    data: { roomId: data.roomId || 'general' },
  }))
})

// tap the notification: focus an open tab (and switch it to the room) or open the app
self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const roomId = (e.notification.data && e.notification.data.roomId) || 'general'
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) {
      if (new URL(c.url).origin === self.location.origin) { c.postMessage({ type: 'open-room', roomId }); return c.focus() }
    }
    return self.clients.openWindow(`/?room=${encodeURIComponent(roomId)}`)
  }))
})
