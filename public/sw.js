/**
 * FanHub Service Worker
 * Strategy:
 *  - Static assets (JS, CSS, fonts, images): Cache-First
 *  - API routes (/api/*): Network-First with fallback to cache
 *  - Navigation (HTML pages): Network-First with offline fallback
 */

const CACHE_NAME = 'fanhub-v1';
const OFFLINE_URL = '/offline.html';

// Assets to pre-cache on install
const PRECACHE_URLS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png',
];

// ─── Install ───────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  // Activate immediately — don't wait for old SW to die
  self.skipWaiting();
});

// ─── Activate ──────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  // Take control of all clients immediately
  self.clients.claim();
});

// ─── Fetch ─────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== location.origin) return;

  // Skip non-GET requests (POST, PATCH, DELETE — let them go through)
  if (request.method !== 'GET') return;

  // Skip NextAuth internal routes
  if (url.pathname.startsWith('/api/auth')) return;

  // ── API routes: Network-First ──────────────────────────────────────────
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // ── Static assets: Cache-First ─────────────────────────────────────────
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    /\.(png|jpg|jpeg|webp|gif|svg|ico|woff|woff2|ttf|otf)$/.test(url.pathname)
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // ── Navigation (HTML): Network-First with offline page ─────────────────
  if (request.mode === 'navigate') {
    event.respondWith(navigationHandler(request));
    return;
  }

  // Default: network with cache fallback
  event.respondWith(networkFirst(request));
});

// ─── Strategies ────────────────────────────────────────────────────────────

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Asset not available offline', { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(
      JSON.stringify({ error: 'Sin conexión. Intenta de nuevo cuando tengas internet.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function navigationHandler(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    // Fall back to offline page
    const offlinePage = await caches.match(OFFLINE_URL);
    return offlinePage || new Response('<h1>Sin conexión</h1>', {
      status: 503,
      headers: { 'Content-Type': 'text/html' },
    });
  }
}
