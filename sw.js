const C = 'berichtsheft-v3';
const LOCAL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];
const CDN = ['cdnjs.cloudflare.com', 'www.gstatic.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(LOCAL))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  // App-Seite: immer zuerst Netz (neue Version sofort), offline aus Cache
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { caches.open(C).then(c => c.put('./index.html', r.clone())); return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  // Firebase-Verkehr nie cachen
  if (u.origin !== location.origin && !CDN.includes(u.hostname)) return;
  if (u.hostname === 'www.gstatic.com' && !u.pathname.startsWith('/firebasejs/')) return;
  e.respondWith(caches.open(C).then(async c => {
    const hit = await c.match(req);
    const net = fetch(req).then(r => { if (r && (r.ok || r.type === 'opaque')) c.put(req, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});
