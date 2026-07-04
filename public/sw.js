// public/sw.js

const CACHE_NAME = 'dealdoor-v1';
const STATIC_CACHE = 'dealdoor-static-v1';
const DYNAMIC_CACHE = 'dealdoor-dynamic-v1';

// Static assets to cache
const STATIC_ASSETS = [
  '/',
  '/explore',
  '/offline.html',
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip API requests (network only)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkOnly(request));
    return;
  }

  // Static assets: Cache first
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // HTML pages: Network first, fallback to cache
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
    return;
  }

  // Other requests: Network first
  event.respondWith(networkFirst(request, DYNAMIC_CACHE));
});

// Cache strategies
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return caches.match('/offline.html');
  }
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    return cached || caches.match('/offline.html');
  }
}

async function networkOnly(request) {
  return fetch(request);
}

// Helper functions
function isStaticAsset(pathname) {
  return /\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/.test(pathname);
}
