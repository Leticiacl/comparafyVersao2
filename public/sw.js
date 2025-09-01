// Simple service worker (cache static + network-first for pages)
const CACHE_NAME = "comparafy-cache-v1";
const STATIC_ASSETS = ["/", "/index.html", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.map((k) => (k === CACHE_NAME ? null : caches.delete(k))))));
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).then((res) => {
        const r = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put("/", r));
        return res;
      }).catch(() => caches.match("/"))
    );
    return;
  }

  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req).then((res) => {
        const r = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(req, r));
        return res;
      }))
    );
  }
});