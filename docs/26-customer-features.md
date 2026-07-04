# DealDoor — Customer Features Design

---

## 1. Overview

Customer features enhance the experience for deal seekers and encourage return visits.

---

## 2. Feature Priority

| Feature | Priority | Phase |
|---------|----------|-------|
| Save/bookmark deals | High | Phase 2 |
| Favorite shops | High | Phase 2 |
| Deal alerts | Medium | Phase 2 |
| Share deals | High | MVP |
| Search deals | High | MVP |
| Category filter | High | MVP |

---

## 3. Save/Bookmark Deals

### 3.1 Database Schema

```typescript
// db/schema.ts (additions)

export const savedDeals = sqliteTable('saved_deals', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id'),                    // null for anonymous (localStorage)
  dealId: text('deal_id').notNull().references(() => deals.id),
  shopId: text('shop_id').notNull().references(() => shops.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const favoriteShops = sqliteTable('favorite_shops', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id'),
  shopId: text('shop_id').notNull().references(() => shops.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
```

### 3.2 localStorage Approach (MVP)

```typescript
// src/lib/saved-deals.ts

const STORAGE_KEY = 'dealdoor_saved_deals';

export function getSavedDeals(): string[] {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : [];
}

export function saveDeal(dealId: string): void {
  const saved = getSavedDeals();
  if (!saved.includes(dealId)) {
    saved.push(dealId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  }
}

export function unsaveDeal(dealId: string): void {
  const saved = getSavedDeals().filter(id => id !== dealId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
}

export function isDealSaved(dealId: string): boolean {
  return getSavedDeals().includes(dealId);
}
```

### 3.3 Save Button Component

```tsx
// src/components/shared/SaveButton.tsx

import { useState, useEffect } from 'react';
import { isDealSaved, saveDeal, unsaveDeal } from '../../lib/saved-deals';

interface SaveButtonProps {
  dealId: string;
  showLabel?: boolean;
}

export default function SaveButton({ dealId, showLabel = false }: SaveButtonProps) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(isDealSaved(dealId));
  }, [dealId]);

  const handleToggle = () => {
    if (saved) {
      unsaveDeal(dealId);
    } else {
      saveDeal(dealId);
    }
    setSaved(!saved);
  };

  return (
    <button
      onClick={handleToggle}
      className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm transition-colors ${
        saved
          ? 'bg-primary-light text-primary'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
      aria-label={saved ? 'ยกเลิกบันทึก' : 'บันทึกดีล'}
    >
      <span>{saved ? '❤️' : '🤍'}</span>
      {showLabel && <span>{saved ? 'บันทึกแล้ว' : 'บันทึก'}</span>}
    </button>
  );
}
```

---

## 4. Favorite Shops

### 4.1 localStorage

```typescript
// src/lib/favorite-shops.ts

const STORAGE_KEY = 'dealdoor_favorite_shops';

export function getFavoriteShops(): string[] {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : [];
}

export function addFavoriteShop(shopId: string): void {
  const favorites = getFavoriteShops();
  if (!favorites.includes(shopId)) {
    favorites.push(shopId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  }
}

export function removeFavoriteShop(shopId: string): void {
  const favorites = getFavoriteShops().filter(id => id !== shopId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
}

export function isFavoriteShop(shopId: string): boolean {
  return getFavoriteShops().includes(shopId);
}
```

### 4.2 Favorite Button

```tsx
// src/components/shared/FavoriteButton.tsx

import { useState, useEffect } from 'react';
import { isFavoriteShop, addFavoriteShop, removeFavoriteShop } from '../../lib/favorite-shops';

interface FavoriteButtonProps {
  shopId: string;
}

export default function FavoriteButton({ shopId }: FavoriteButtonProps) {
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    setFavorite(isFavoriteShop(shopId));
  }, [shopId]);

  const handleToggle = () => {
    if (favorite) {
      removeFavoriteShop(shopId);
    } else {
      addFavoriteShop(shopId);
    }
    setFavorite(!favorite);
  };

  return (
    <button
      onClick={handleToggle}
      className="rounded-full p-2 transition-colors hover:bg-gray-100"
      aria-label={favorite ? 'ยกเลิกติดตาม' : 'ติดตามร้าน'}
    >
      <span className="text-xl">{favorite ? '⭐' : '☆'}</span>
    </button>
  );
}
```

---

## 5. Saved Deals Page

### 5.1 Page Component

```astro
---
// src/pages/saved.astro

import BaseLayout from '../layouts/BaseLayout.astro';
import DealCard from '../components/shop/DealCard.astro';
import { getSavedDeals } from '../lib/saved-deals';

// This page uses client-side rendering for saved deals
---

<BaseLayout title="ดีลที่บันทึก">
  <div class="mx-auto max-w-shop px-4 py-6">
    <h1 class="text-xl font-bold">ดีลที่บันทึก</h1>
    
    <div id="saved-deals" class="mt-4 space-y-4">
      <!-- Loaded via JavaScript -->
    </div>
    
    <div id="empty-state" class="hidden rounded-lg border border-dashed p-8 text-center">
      <span class="text-4xl">❤️</span>
      <h3 class="mt-2 text-lg font-medium">ยังไม่มีดีลที่บันทึก</h3>
      <p class="mt-1 text-sm text-gray-500">กดหัวใจเพื่อบันทึกดีลที่สนใจ</p>
      <a href="/explore" class="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-white">
        ค้นหาดีล
      </a>
    </div>
  </div>
</BaseLayout>

<script>
  import { getSavedDeals } from '../lib/saved-deals';
  
  async function loadSavedDeals() {
    const savedIds = getSavedDeals();
    const container = document.getElementById('saved-deals');
    const emptyState = document.getElementById('empty-state');
    
    if (savedIds.length === 0) {
      emptyState?.classList.remove('hidden');
      return;
    }
    
    // Fetch deal details
    const deals = await Promise.all(
      savedIds.map(id => fetch(`/api/deals/${id}`).then(r => r.json()))
    );
    
    // Render deals
    // ...
  }
  
  loadSavedDeals();
</script>
```

---

## 6. Deal Alerts (Future)

### 6.1 Alert Preferences

```typescript
// src/lib/deal-alerts.ts

export interface DealAlert {
  shopId: string;
  categories: string[];    // ['birthday', 'student', etc.]
  notifyVia: 'push' | 'email';
}

const STORAGE_KEY = 'dealdoor_alerts';

export function getAlerts(): DealAlert[] {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : [];
}

export function addAlert(alert: DealAlert): void {
  const alerts = getAlerts();
  alerts.push(alert);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
}

export function removeAlert(shopId: string): void {
  const alerts = getAlerts().filter(a => a.shopId !== shopId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
}
```

### 6.2 Alert Setup Component

```tsx
// src/components/shared/DealAlertSetup.tsx

import { useState } from 'react';
import { DEAL_CATEGORY_LABELS } from '../../lib/constants';

interface DealAlertSetupProps {
  shopId: string;
  shopName: string;
}

export default function DealAlertSetup({ shopId, shopName }: DealAlertSetupProps) {
  const [categories, setCategories] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const handleSave = () => {
    addAlert({ shopId, categories, notifyVia: 'push' });
    setIsOpen(false);
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="text-sm text-primary">
        🔔 ตั้งเตือนดีล
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-lg bg-white p-4">
            <h3 className="font-semibold">ตั้งเตือนดีลจาก {shopName}</h3>
            <p className="mt-1 text-sm text-gray-500">
              เลือกหมวดหมู่ที่สนใจ เราจะแจ้งเตือนเมื่อมีดีลใหม่
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {Object.entries(DEAL_CATEGORY_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => {
                    setCategories(prev =>
                      prev.includes(key) ? prev.filter(c => c !== key) : [...prev, key]
                    );
                  }}
                  className={`rounded-full px-3 py-1 text-sm ${
                    categories.includes(key) ? 'bg-primary text-white' : 'bg-gray-100'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setIsOpen(false)} className="px-3 py-1 text-sm">
                ยกเลิก
              </button>
              <button
                onClick={handleSave}
                disabled={categories.length === 0}
                className="rounded bg-primary px-3 py-1 text-sm text-white disabled:opacity-50"
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

---

## 7. Share Deal Component

```tsx
// src/components/shared/ShareDealButton.tsx

import { useState } from 'react';

interface ShareDealButtonProps {
  dealId: string;
  shopSlug: string;
  dealTitle: string;
  shopName: string;
}

export default function ShareDealButton({
  dealId,
  shopSlug,
  dealTitle,
  shopName,
}: ShareDealButtonProps) {
  const [showMenu, setShowMenu] = useState(false);

  const url = `https://dealdoor.co/${shopSlug}?deal=${dealId}`;
  const text = `${dealTitle} จาก ${shopName}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: dealTitle, text, url });
      } catch {}
    } else {
      setShowMenu(true);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    showToast('คัดลอกลิงก์แล้ว!', 'success');
    setShowMenu(false);
  };

  return (
    <div className="relative">
      <button
        onClick={handleShare}
        className="rounded-lg border px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
      >
        📤 แชร์
      </button>

      {showMenu && (
        <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-lg border bg-white shadow-lg">
          <a
            href={`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`}
            target="_blank"
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
          >
            💬 LINE
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
            target="_blank"
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
          >
            📘 Facebook
          </a>
          <button
            onClick={handleCopy}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
          >
            📋 คัดลอกลิงก์
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## 8. Customer Preferences

### 8.1 Preferences Schema

```typescript
// For registered customers (future)

export const customerPreferences = sqliteTable('customer_preferences', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  favoriteCategories: text('favorite_categories'),  // JSON array
  locationLat: real('location_lat'),
  locationLng: real('location_lng'),
  notificationEnabled: integer('notification_enabled', { mode: 'boolean' }).default(true),
  emailDigest: text('email_digest').default('weekly'),  // daily, weekly, never
});
```

### 8.2 Preferences Page (Future)

```astro
---
// src/pages/preferences.astro
---

<BaseLayout title="ตั้งค่า">
  <div class="mx-auto max-w-md px-4 py-6">
    <h1 class="text-xl font-bold">ตั้งค่า</h1>
    
    <div class="mt-6 space-y-6">
      <!-- Favorite categories -->
      <div>
        <h2 class="font-medium">หมวดหมู่ที่สนใจ</h2>
        <div class="mt-2 flex flex-wrap gap-2">
          <!-- Category chips -->
        </div>
      </div>
      
      <!-- Location -->
      <div>
        <h2 class="font-medium">ตำแหน่ง</h2>
        <input type="text" placeholder="กรอกที่อยู่" class="mt-2 w-full rounded border p-2" />
      </div>
      
      <!-- Notifications -->
      <div>
        <h2 class="font-medium">การแจ้งเตือน</h2>
        <label class="mt-2 flex items-center gap-2">
          <input type="checkbox" checked />
          <span>แจ้งเตือนดีลใกล้หมดอายุ</span>
        </label>
        <label class="mt-2 flex items-center gap-2">
          <input type="checkbox" checked />
          <span>ดีลใหม่จากร้านที่ติดตาม</span>
        </label>
      </div>
    </div>
  </div>
</BaseLayout>
```

---

## 9. File Structure

```
src/
├── lib/
│   ├── saved-deals.ts          # Save/bookmark logic
│   ├── favorite-shops.ts       # Favorite shops logic
│   └── deal-alerts.ts          # Deal alert preferences
├── components/
│   └── shared/
│       ├── SaveButton.tsx
│       ├── FavoriteButton.tsx
│       ├── ShareDealButton.tsx
│       └── DealAlertSetup.tsx
└── pages/
    ├── saved.astro             # Saved deals page
    └── preferences.astro       # Customer preferences
```
