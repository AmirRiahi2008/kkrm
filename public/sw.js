const worker = globalThis;
const CACHE_NAME = "kkrm-pwa-shell-v1";
const SHELL_FILES = [
  "/pwa/offline.html",
  "/pwa/offline-en.html",
  "/pwa/icon-192.png",
  "/pwa/icon-512.png",
  "/pwa/maskable-512.png",
  "/pwa/apple-touch-icon.png",
];

worker.addEventListener("install", (event) => {
  event.waitUntil(
    worker.caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)),
  );
});

worker.addEventListener("activate", (event) => {
  event.waitUntil(
    worker.caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) => key.startsWith("kkrm-pwa-shell-") && key !== CACHE_NAME,
            )
            .map((key) => worker.caches.delete(key)),
        ),
      )
      .then(() => worker.clients.claim()),
  );
});

worker.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") worker.skipWaiting();
});

worker.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== worker.location.origin) return;
  if (/^\/(?:en\/)?(?:admin|backend|api|auth)(?:\/|$)/.test(url.pathname))
    return;
  if (request.mode === "navigate") {
    event.respondWith(
      worker.fetch(request).catch(async () => {
        const cache = await worker.caches.open(CACHE_NAME);
        const english =
          url.pathname === "/en" || url.pathname.startsWith("/en/");
        return (
          (await cache.match(
            english ? "/pwa/offline-en.html" : "/pwa/offline.html",
          )) ||
          new Response("Offline", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          })
        );
      }),
    );
    return;
  }
  if (SHELL_FILES.includes(url.pathname) && !url.search) {
    event.respondWith(
      worker.caches
        .open(CACHE_NAME)
        .then(
          async (cache) =>
            (await cache.match(request)) || worker.fetch(request),
        ),
    );
  }
});
