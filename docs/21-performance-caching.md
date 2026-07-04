# DealDoor — Performance & Caching Design

---

## 1. Overview

Performance is critical for mobile users on slow connections. This document covers optimization strategies.

---

## 2. Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| FCP | < 1.5s | First Contentful Paint |
| LCP | < 2.5s | Largest Contentful Paint |
| CLS | < 0.1 | Cumulative Layout Shift |
| TTI | < 3.5s | Time to Interactive |
| TTFB | < 200ms | Time to First Byte |
| Bundle Size | < 100KB | JS shipped to client |

---

## 3. Rendering Strategy

| Page | Strategy | Cache Duration |
|------|----------|----------------|
| Landing | SSG (Static) | 1 hour |
| Shop Page | SSR | 5 minutes |
| Explore | SSR | 1 minute |
| Dashboard | CSR | No cache |
| API Routes | SSR | No cache |

---

## 4. Caching Layers

```
┌─────────────────────────────────────────────────────────┐
│                    Browser Cache                         │
│  (Service Worker, HTTP Cache Headers)                    │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    CDN Cache                             │
│  (Cloudflare, Vercel Edge)                               │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    Application Cache                     │
│  (In-memory, Redis future)                               │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    Database Cache                        │
│  (SQLite WAL mode, query cache)                          │
└─────────────────────────────────────────────────────────┘
```

---

## 5. HTTP Cache Headers

### 5.1 Static Assets

```typescript
// astro.config.ts

export default defineConfig({
  vite: {
    build: {
      rollupOptions: {
        output: {
          assetFileNames: 'assets/[name].[hash][extname]',
        },
      },
    },
  },
});
```

```
# Static assets (JS, CSS, images with hash)
Cache-Control: public, max-age=31536000, immutable

# Fonts
Cache-Control: public, max-age=31536000, immutable
```

### 5.2 Dynamic Pages

```typescript
// In Astro middleware or API routes

// Shop page - short cache, stale-while-revalidate
Astro.response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

// Explore page - very short cache
Astro.response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');

// Dashboard - no cache
Astro.response.headers.set('Cache-Control', 'private, no-store');
```

### 5.3 API Responses

```typescript
// API with data
response.headers.set('Cache-Control', 'public, s-maxage=60');

// API with user-specific data
response.headers.set('Cache-Control', 'private, no-store');
```

---

## 6. Image Optimization

### 6.1 Responsive Images

```astro
<picture>
  <source
    srcset="/images/shop-cover-400.webp 400w,
            /images/shop-cover-800.webp 800w,
            /images/shop-cover-1200.webp 1200w"
    sizes="(max-width: 480px) 100vw, 480px"
    type="image/webp"
  />
  <img
    src="/images/shop-cover-800.jpg"
    alt="Shop cover"
    loading="lazy"
    decoding="async"
    width="800"
    height="400"
  />
</picture>
```

### 6.2 Lazy Loading

```astro
<!-- Native lazy loading -->
<img src={imageUrl} loading="lazy" alt="..." />

<!-- Eager loading for above-the-fold images -->
<img src={heroImage} loading="eager" alt="..." fetchpriority="high" />
```

### 6.3 Image CDN (Cloudflare Image Resizing)

```
https://cdn.dealdoor.co/cdn-cgi/image/width=400,quality=80,format=auto/uploads/shops/covers/abc123.webp
```

---

## 7. JavaScript Optimization

### 7.1 Code Splitting

```typescript
// Dynamic imports for heavy components

const DealDetailModal = lazy(() => import('../components/DealDetailModal'));
const AnalyticsChart = lazy(() => import('../components/AnalyticsChart'));
```

### 7.2 Astro Islands

```astro
<!-- Only hydrate when visible -->
<DealDetailModal client:visible />

<!-- Only hydrate on interaction -->
<ShareButton client:idle />

<!-- Hydrate immediately (for critical interactive elements) -->
<ThemeToggle client:load />
```

### 7.3 Bundle Analysis

```bash
# Analyze bundle size
pnpm build --stats
npx vite-bundle-visualizer
```

---

## 8. Font Optimization

### 8.1 Font Loading Strategy

```html
<head>
  <!-- Preload critical fonts -->
  <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossorigin />
  
  <!-- Font display swap -->
  <style>
    @font-face {
      font-family: 'Inter';
      src: url('/fonts/inter-var.woff2') format('woff2');
      font-display: swap;
    }
  </style>
</head>
```

### 8.2 Font Subsetting

```css
/* Only load Thai + Latin characters */
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-thai-latin.woff2') format('woff2');
  unicode-range: U+0000-00FF, U+0E00-0E7F;
}
```

---

## 9. Database Performance

### 9.1 SQLite WAL Mode

```typescript
// src/lib/db.ts

import Database from 'better-sqlite3';

const sqlite = new Database('./db/prod.db');
sqlite.pragma('journal_mode = WAL');      // Write-Ahead Logging
sqlite.pragma('synchronous = NORMAL');     // Balanced safety/speed
sqlite.pragma('cache_size = -20000');      // 20MB cache
sqlite.pragma('foreign_keys = ON');
sqlite.pragma('busy_timeout = 5000');
```

### 9.2 Query Optimization

```typescript
// Use indexes for common queries
// db/schema.ts

export const shops = sqliteTable('shops', {
  // ...
}, (table) => ({
  slugIdx: index('shops_slug_idx').on(table.slug),
  categoryIdx: index('shops_category_idx').on(table.category),
  merchantIdx: index('shops_merchant_idx').on(table.merchantId),
}));

export const deals = sqliteTable('deals', {
  // ...
}, (table) => ({
  shopIdx: index('deals_shop_idx').on(table.shopId),
  activeIdx: index('deals_active_idx').on(table.isActive, table.endDate),
  categoryIdx: index('deals_category_idx').on(table.category),
}));
```

### 9.3 Connection Pooling (Not needed for SQLite)

SQLite is file-based, so no connection pooling. Use WAL mode for concurrent reads.

---

## 10. Prefetching & Preloading

### 10.1 Link Prefetching

```astro
<!-- Prefetch likely next pages -->
<link rel="prefetch" href="/explore" />
<link rel="prefetch" href="/dashboard" />
```

### 10.2 Hover Prefetch (Astro)

```astro
<!-- Astro View Transitions handles this automatically -->
<a href="/explore" data-astro-prefetch>Explore</a>
```

### 10.3 DNS Prefetch

```html
<!-- Prefetch external domains -->
<link rel="dns-prefetch" href="//fonts.googleapis.com" />
<link rel="dns-prefetch" href="//cdn.dealdoor.co" />
```

---

## 11. Critical CSS

### 11.1 Inline Critical CSS

```astro
---
// Extract critical CSS for above-the-fold content
---

<style>
  /* Critical styles inlined */
  :root { --primary: #FF6B35; }
  body { margin: 0; font-family: 'Inter', sans-serif; }
  .header { position: sticky; top: 0; z-index: 50; }
  .hero { padding: 2rem; }
</style>

<!-- Non-critical CSS deferred -->
<link rel="preload" href="/styles/main.css" as="style" onload="this.onload=null;this.rel='stylesheet'" />
<noscript><link rel="stylesheet" href="/styles/main.css" /></noscript>
```

---

## 12. Service Worker Caching

### 12.1 Cache Strategy

```javascript
// public/sw.js

const CACHE_NAME = 'dealdoor-v1';
const STATIC_CACHE = 'dealdoor-static-v1';
const DYNAMIC_CACHE = 'dealdoor-dynamic-v1';

const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/styles/global.css',
  '/fonts/inter-var.woff2',
];

// Cache-first for static assets
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  
  const response = await fetch(request);
  const cache = await caches.open(STATIC_CACHE);
  cache.put(request, response.clone());
  return response;
}

// Network-first for dynamic content
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(DYNAMIC_CACHE);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    return cached || caches.match('/offline.html');
  }
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Static assets: cache-first
  if (url.pathname.match(/\.(css|js|woff2|png|jpg|webp)$/)) {
    event.respondWith(cacheFirst(event.request));
  } 
  // Dynamic content: network-first
  else {
    event.respondWith(networkFirst(event.request));
  }
});
```

---

## 13. Third-Party Scripts

### 13.1 Defer Non-Critical Scripts

```html
<!-- Analytics - defer -->
<script defer data-domain="dealdoor.co" src="https://plausible.io/js/script.js"></script>

<!-- Chat widget - lazy load -->
<script>
  window.addEventListener('load', () => {
    const script = document.createElement('script');
    script.src = 'https://chat-widget.example.com/widget.js';
    document.body.appendChild(script);
  });
</script>
```

### 13.2 Resource Hints

```html
<head>
  <!-- Preconnect to external origins -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  
  <!-- Preload critical resources -->
  <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossorigin />
</head>
```

---

## 14. Performance Monitoring

### 14.1 Core Web Vitals

```javascript
// Track Core Web Vitals
import { onCLS, onFID, onLCP } from 'web-vitals';

function sendToAnalytics({ name, delta, id }) {
  // Send to analytics
  console.log({ name, delta, id });
}

onCLS(sendToAnalytics);
onFID(sendToAnalytics);
onLCP(sendToAnalytics);
```

### 14.2 Lighthouse CI

```yaml
# .github/workflows/lighthouse.yml

- name: Lighthouse CI
  uses: treosh/lighthouse-ci-action@v10
  with:
    urls: |
      https://dealdoor.co/
      https://dealdoor.co/moon-bowl-cafe
    budgetPath: ./budget.json
```

```json
// budget.json

[
  {
    "path": "/*",
    "timings": [
      { "metric": "first-contentful-past", "budget": 1500 },
      { "metric": "largest-contentful-paint", "budget": 2500 },
      { "metric": "cumulative-layout-shift", "budget": 0.1 }
    ],
    "resourceSizes": [
      { "resourceType": "total", "budget": 300 },
      { "resourceType": "script", "budget": 100 },
      { "resourceType": "stylesheet", "budget": 50 }
    ]
  }
]
```

---

## 15. Checklist

### Images
- [ ] Use WebP format
- [ ] Responsive srcset
- [ ] Lazy loading for below-fold
- [ ] Explicit width/height to prevent CLS
- [ ] Image CDN for resizing

### JavaScript
- [ ] Code splitting
- [ ] Dynamic imports for heavy components
- [ ] Astro islands with appropriate hydration
- [ ] Bundle size < 100KB

### CSS
- [ ] Critical CSS inlined
- [ ] Non-critical CSS deferred
- [ ] Unused CSS removed

### Fonts
- [ ] Preload critical fonts
- [ ] font-display: swap
- [ ] Subset for Thai + Latin

### Caching
- [ ] Static assets: immutable cache
- [ ] Dynamic pages: stale-while-revalidate
- [ ] Service worker for offline

### Database
- [ ] WAL mode enabled
- [ ] Indexes on common queries
- [ ] Query optimization
