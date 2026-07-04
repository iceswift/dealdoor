# DealDoor — PWA & Deep Links Design

---

## 1. Overview

PWA (Progressive Web App) enables app-like experience. Deep links enable direct navigation from LINE, Facebook, etc.

---

## 2. PWA Features

| Feature | MVP | Future |
|---------|-----|--------|
| Installable | Yes | Yes |
| Offline support | No | Basic |
| Push notifications | No | Yes |
| App-like UI | Yes | Yes |
| Home screen icon | Yes | Yes |

---

## 3. Web App Manifest

### 3.1 `public/manifest.json`

```json
{
  "name": "DealDoor — ดีลไหนดี",
  "short_name": "DealDoor",
  "description": "หน้าโปรโมชันร้านค้า แชร์ง่าย หมดอายุเอง",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#FFFFFF",
  "theme_color": "#FF6B35",
  "orientation": "portrait",
  "scope": "/",
  "lang": "th",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/shop-page.png",
      "sizes": "1170x2532",
      "type": "image/png",
      "form_factor": "narrow"
    }
  ],
  "categories": ["shopping", "lifestyle"],
  "shortcuts": [
    {
      "name": "Explore Deals",
      "short_name": "Explore",
      "url": "/explore",
      "icons": [{ "src": "/icons/explore-96x96.png", "sizes": "96x96" }]
    },
    {
      "name": "Create Shop",
      "short_name": "Create",
      "url": "/dashboard",
      "icons": [{ "src": "/icons/create-96x96.png", "sizes": "96x96" }]
    }
  ]
}
```

---

## 4. Service Worker

### 4.1 Basic Service Worker

```typescript
// public/sw.js

const CACHE_NAME = 'dealdoor-v1';
const STATIC_ASSETS = [
  '/',
  '/explore',
  '/offline.html',
  '/styles/global.css',
  '/icons/icon-192x192.png',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
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
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip API requests
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(event.request).then((cached) => {
          return cached || caches.match('/offline.html');
        });
      })
  );
});
```

### 4.2 Offline Page

```html
<!-- public/offline.html -->
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ออฟไลน์ | DealDoor</title>
  <style>
    body {
      font-family: 'Inter', 'Noto Sans Thai', sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: #F7F7F8;
    }
    .container {
      text-align: center;
      padding: 2rem;
    }
    .icon { font-size: 4rem; }
    h1 { margin-top: 1rem; color: #1A1A2E; }
    p { color: #6B6B6B; }
    button {
      margin-top: 1.5rem;
      padding: 0.75rem 1.5rem;
      background: #FF6B35;
      color: white;
      border: none;
      border-radius: 0.5rem;
      font-size: 1rem;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">📡</div>
    <h1>คุณกำลังออฟไลน์</h1>
    <p>กรุณาเชื่อมต่ออินเทอร์เน็ตแล้วลองใหม่</p>
    <button onclick="window.location.reload()">ลองใหม่</button>
  </div>
</body>
</html>
```

---

## 5. Register Service Worker

```astro
---
// src/layouts/BaseLayout.astro
---

<head>
  <!-- Manifest -->
  <link rel="manifest" href="/manifest.json" />
  
  <!-- Theme Color -->
  <meta name="theme-color" content="#FF6B35" />
  
  <!-- Apple Touch Icon -->
  <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
  
  <!-- Apple Mobile Web App -->
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
  <meta name="apple-mobile-web-app-title" content="DealDoor" />
</head>

<script>
  // Register service worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered:', registration.scope);
        })
        .catch((error) => {
          console.log('SW registration failed:', error);
        });
    });
  }
</script>
```

---

## 6. Deep Links

### 6.1 LINE Deep Link

```typescript
// src/lib/deep-links.ts

export function generateLineDeepLink(url: string, text?: string): string {
  const params = new URLSearchParams({ url });
  if (text) params.set('text', text);
  return `https://social-plugins.line.me/lineit/share?${params.toString()}`;
}

// Usage
const lineUrl = generateLineDeepLink(
  'https://dealdoor.co/moon-bowl-cafe',
  'ดูโปรล่าสุดจาก Moon Bowl Cafe'
);
```

### 6.2 Facebook Deep Link

```typescript
export function generateFacebookDeepLink(url: string): string {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
}
```

### 6.3 Instagram (Copy to Clipboard)

```typescript
export function shareToInstagram(url: string, text: string): void {
  // Instagram doesn't support direct sharing URL
  // Copy to clipboard and show instructions
  navigator.clipboard.writeText(`${text}\n${url}`);
  showToast('คัดลอกลิงก์แล้ว! เปิด Instagram แล้ววาง', 'success');
}
```

### 6.4 TikTok (Copy to Clipboard)

```typescript
export function shareToTikTok(url: string, text: string): void {
  navigator.clipboard.writeText(`${text}\n${url}`);
  showToast('คัดลอกลิงก์แล้ว! เปิด TikTok แล้ววาง', 'success');
}
```

### 6.5 WhatsApp

```typescript
export function generateWhatsAppDeepLink(url: string, text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`;
}
```

---

## 7. Universal Links (iOS) / App Links (Android)

### 7.1 iOS Universal Links

```json
// public/.well-known/apple-app-site-association

{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAM_ID.co.dealdoor",
        "paths": ["/*"]
      }
    ]
  }
}
```

### 7.2 Android App Links

```json
// public/.well-known/assetlinks.json

[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "co.dealdoor.app",
    "sha256_cert_fingerprints": ["SHA256_FINGERPRINT"]
  }
}]
```

---

## 8. Share Component

```tsx
// src/components/shared/ShareButton.tsx

import { useState } from 'react';
import {
  generateLineDeepLink,
  generateFacebookDeepLink,
  generateWhatsAppDeepLink,
} from '../../lib/deep-links';

interface ShareButtonProps {
  url: string;
  title: string;
  description?: string;
}

export default function ShareButton({ url, title, description }: ShareButtonProps) {
  const [showMenu, setShowMenu] = useState(false);

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url,
        });
      } catch (err) {
        // User cancelled
      }
    } else {
      setShowMenu(true);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(url);
    showToast('คัดลอกลิงก์แล้ว!', 'success');
    setShowMenu(false);
  };

  return (
    <div className="relative">
      <button
        onClick={handleNativeShare}
        className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
      >
        แชร์
      </button>

      {showMenu && (
        <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-lg border bg-white shadow-lg">
          <a
            href={generateLineDeepLink(url, title)}
            target="_blank"
            rel="noopener"
            className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
          >
            <span>💬</span> LINE
          </a>
          <a
            href={generateFacebookDeepLink(url)}
            target="_blank"
            rel="noopener"
            className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
          >
            <span>📘</span> Facebook
          </a>
          <a
            href={generateWhatsAppDeepLink(url, title)}
            target="_blank"
            rel="noopener"
            className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
          >
            <span>📱</span> WhatsApp
          </a>
          <button
            onClick={handleCopyLink}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
          >
            <span>📋</span> คัดลอกลิงก์
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## 9. Install Prompt

```tsx
// src/components/shared/InstallPrompt.tsx

import { useState, useEffect } from 'react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowInstall(false);
    }
    setDeferredPrompt(null);
  };

  if (!showInstall) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 rounded-lg border bg-white p-4 shadow-lg sm:left-auto sm:right-4 sm:w-80">
      <div className="flex items-start gap-3">
        <span className="text-2xl">📱</span>
        <div className="flex-1">
          <h3 className="font-medium">ติดตั้ง DealDoor</h3>
          <p className="mt-1 text-sm text-gray-500">
            ติดตั้งเป็นแอปเพื่อเข้าถึงเร็วขึ้น
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleInstall}
              className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white"
            >
              ติดตั้ง
            </button>
            <button
              onClick={() => setShowInstall(false)}
              className="rounded-lg px-3 py-1.5 text-sm text-gray-500"
            >
              ไม่ใช่ตอนนี้
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 10. Push Notifications (Future)

### 10.1 Notification Events

| Trigger | Message | Target |
|---------|---------|--------|
| Deal expiring in 24h | "ดีล {name} จะหมดอายุพรุ่งนี้!" | Subscribers |
| New deal added | "{shop} เพิ่มดีลใหม่!" | Subscribers |
| Deal expiring today | "ดีล {name} หมดอายุวันนี้!" | Subscribers |

### 10.2 Web Push Setup (Future)

```typescript
// src/lib/push.ts

export async function subscribeToPush(userId: string): Promise<void> {
  const registration = await navigator.serviceWorker.ready;
  
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: process.env.VAPID_PUBLIC_KEY,
  });

  // Save subscription to database
  await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, subscription }),
  });
}
```

---

## 11. File Structure

```
public/
├── manifest.json
├── sw.js
├── offline.html
├── icons/
│   ├── icon-72x72.png
│   ├── icon-96x96.png
│   ├── icon-128x128.png
│   ├── icon-144x144.png
│   ├── icon-152x152.png
│   ├── icon-192x192.png
│   ├── icon-384x384.png
│   └── icon-512x512.png
└── .well-known/
    ├── apple-app-site-association
    └── assetlinks.json

src/
├── lib/
│   └── deep-links.ts
├── components/
│   └── shared/
│       ├── ShareButton.tsx
│       └── InstallPrompt.tsx
```
