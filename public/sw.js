/**
 * §12.7's offline architecture + §10's Web Push delivery, for the buyer
 * PWA only — registered with `{ scope: "/buyer/" }` (see app/buyer/layout.tsx)
 * so it never intercepts a Trading Console request.
 *
 * Hand-rolled rather than next-pwa/Workbox: this repo has no build-time
 * precache-manifest generation wired up, so the strategy below is a
 * pragmatic runtime cache rather than a true precached app shell —
 * cache-first for the app's own static assets and navigations (safe,
 * since Next.js's build output is content-hashed and immutable), and
 * stale-while-revalidate for the one API call that matters offline
 * (`/api/v1/buyer/dnbp/current`).
 */

const APP_SHELL_CACHE = "buyer-app-shell-v1";
const DNBP_CACHE = "buyer-dnbp-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== APP_SHELL_CACHE && key !== DNBP_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

function isDnbpCurrentRequest(url) {
  return url.pathname.endsWith("/api/v1/buyer/dnbp/current");
}

function isBuyerAppRequest(url) {
  return url.pathname.startsWith("/buyer") || url.pathname.startsWith("/_next/static");
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET") return; // writes always go through the page's own queued-sync path

  if (isDnbpCurrentRequest(url)) {
    event.respondWith(staleWhileRevalidate(event.request, DNBP_CACHE));
    return;
  }

  if (isBuyerAppRequest(url)) {
    event.respondWith(cacheFirst(event.request, APP_SHELL_CACHE));
  }
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    if (cached) return cached;
    throw err;
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkFetch = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);
  return cached || (await networkFetch) || new Response(null, { status: 503 });
}

// §10 — Web Push. The payload is the buyer-safe summary built by
// services/delivery_service.py::fan_out — never customer/price/margin data.
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    return;
  }
  event.waitUntil(
    self.registration.showNotification(payload.title || "New Do Not Buy Price", {
      body: payload.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      vibrate: [200, 100, 200], // §12.1 — notifications must vibrate, not merely sound
      data: { publicationId: payload.publication_id },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes("/buyer") && "focus" in client) return client.focus();
      }
      return self.clients.openWindow("/buyer");
    })
  );
});

// Background Sync (progressive enhancement only — no Safari support, per
// §16's iOS 16.4+ requirement; lib/buyer/sync.ts's online-event + interval
// retry is the real, universal mechanism). No page may be open to receive
// this, so it can only ask any that ARE open to flush now.
self.addEventListener("sync", (event) => {
  if (event.tag === "flush-buy-entries") {
    event.waitUntil(
      self.clients.matchAll({ type: "window" }).then((clients) => {
        clients.forEach((client) => client.postMessage({ type: "flush-buy-entries" }));
      })
    );
  }
});
