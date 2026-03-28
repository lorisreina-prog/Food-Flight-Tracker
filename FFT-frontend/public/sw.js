const CACHE = "foodtrace-v4";
const IMMUTABLE = /\/assets\//;

self.addEventListener("install", (e) => {
  // Pre-cache only what we're sure exists. Failures here block the SW install,
  // so we use a try/catch to avoid breaking the entire SW on a 404.
  e.waitUntil(
    caches.open(CACHE)
      .then((cache) =>
        Promise.allSettled([
          cache.add("/logo.png"),
          cache.add("/manifest.json"),
        ])
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const { request } = e;

  // Only handle same-origin requests
  if (!request.url.startsWith(self.location.origin)) return;

  const url = new URL(request.url);

  // API: network only, offline JSON fallback
  if (url.pathname.startsWith("/api/")) {
    e.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ error: "Offline" }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        })
      )
    );
    return;
  }

  // Navigation (HTML pages): ALWAYS network-first.
  // This is the critical fix: ensures every page load gets the latest index.html
  // with correct Vite asset hashes after a new deploy.
  // Falls back to cached "/" ONLY when truly offline.
  if (request.mode === "navigate") {
    e.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put("/", clone));
          }
          return res;
        })
        .catch(async () => {
          const cached = await caches.match("/");
          return cached ?? new Response("Offline", { status: 503 });
        })
    );
    return;
  }

  // Vite content-hashed assets (/assets/*.js, /assets/*.css):
  // cache-first — these filenames are unique per build, safe to cache forever.
  if (IMMUTABLE.test(url.pathname)) {
    e.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((res) => {
            if (res.ok) {
              caches.open(CACHE).then((c) => c.put(request, res.clone()));
            }
            return res;
          })
      )
    );
    return;
  }

  // Everything else (logo, manifest, fonts): network-first, cache fallback
  e.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok) {
          caches.open(CACHE).then((c) => c.put(request, res.clone()));
        }
        return res;
      })
      .catch(() => caches.match(request))
  );
});
