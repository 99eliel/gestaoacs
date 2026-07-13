const APP_VERSION = "v11.0.0-20260713";
const CACHE_NAME = `visitas-acs-${APP_VERSION}`;
const CACHE_PREFIX = "visitas-acs-";

const STATIC_ASSETS = [
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

function isFreshAsset(url) {
  return url.pathname.endsWith("/") ||
    url.pathname.endsWith(".html") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css");
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // HTML, JS e CSS sempre tentam buscar da internet primeiro para não prender versão antiga.
  if (request.mode === "navigate" || isFreshAsset(url)) {
    event.respondWith(
      fetch(request, { cache: "no-store" })
        .then((response) => response)
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // Ícones e manifest podem usar cache, mas atualizam em segundo plano.
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      }).catch(() => cached);

      return cached || networkFetch;
    })
  );
});
