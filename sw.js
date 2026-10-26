```javascript
const CACHE_NAME = "umi-ranis-shell-v1";

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.json"
];

// Memasang service worker dan menyimpan file dasar aplikasi
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

// Mengaktifkan service worker
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key =>
            key.startsWith("umi-ranis-shell-") &&
            key !== CACHE_NAME
          )
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// Mengelola permintaan halaman dan file lokal
self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);

  // Hanya tangani permintaan dari alamat website yang sama
  if (url.origin !== self.location.origin) {
    return;
  }

  // Halaman HTML: utamakan jaringan agar pembaruan tersedia
  if (
    request.method === "GET" &&
    request.mode === "navigate"
  ) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => cache.put("./index.html", copy));

          }

          return response;
        })
        .catch(async () => {
          return (
            await caches.match(request) ||
            await caches.match("./index.html") ||
            Response.error()
          );
        })
    );

    return;
  }

  // File lokal: gunakan cache jika tersedia
  if (
    request.method === "GET" &&
    url.origin === self.location.origin
  ) {
    event.respondWith(
      caches.match(request)
        .then(cached => {
          if (cached) {
            return cached;
          }

          return fetch(request);
        })
    );
  }
});
```