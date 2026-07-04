# DealDoor — Page Routing & URL Design

---

## 1. URL Philosophy

- URLs should be **human-readable** and **shareable**
- Shop pages use **slugs** (not IDs) for SEO and readability
- Deal links can deep-link to specific deals on a shop page
- Dashboard uses simple `/dashboard` path
- Explore uses `/explore` for discovery

---

## 2. Route Map

| Route | Page | Type | Description |
|-------|------|------|-------------|
| `/` | Landing | Static | Home page, product explanation |
| `/explore` | Explore | SSR | Browse all deals |
| `/explore/[category]` | Explore Filtered | SSR | Deals by category |
| `/[slug]` | Shop Page | SSR | Public shop deal page |
| `/[slug]?deal=[id]` | Shop + Deal Detail | SSR | Shop page with deal modal open |
| `/dashboard` | Dashboard | CSR | Merchant dashboard |
| `/dashboard/deals` | Deal Management | CSR | Manage deals |
| `/dashboard/menu` | Menu Management | CSR | Manage menu items |
| `/dashboard/settings` | Shop Settings | CSR | Edit shop info |
| `/dashboard/preview` | Page Preview | CSR | Preview public page |

---

## 3. URL Patterns

### 3.1 Shop Page URL

```
https://dealdoor.co/moon-bowl-cafe
https://dealdoor.co/aroi-noodle-house
https://dealdoor.co/glow-hair-studio
```

**Pattern:** `https://dealdoor.co/[shop-slug]`

**Slug rules:**
- Lowercase
- Hyphens for spaces
- Max 50 characters
- Unique across all shops
- Auto-generated from shop name
- Editable by merchant (with uniqueness check)

**Examples:**
| Shop Name | Slug |
|-----------|------|
| Moon Bowl Cafe | `moon-bowl-cafe` |
| Aroi Noodle House | `aroi-noodle-house` |
| Glow Hair Studio | `glow-hair-studio` |
| ร้านก๋วยเตี๋ยวลุงชัย | `lung-chai-noodle` |

### 3.2 Deal Deep Link

```
https://dealdoor.co/moon-bowl-cafe?deal=deal_001
```

When a user opens this URL:
1. Shop page loads normally
2. Deal modal for `deal_001` opens automatically
3. User can close modal and see full shop page

**Use case:** Merchant shares a specific deal link in LINE/Facebook.

### 3.3 Explore URL

```
https://dealdoor.co/explore
https://dealdoor.co/explore/cafe
https://dealdoor.co/explore/restaurant
```

**Pattern:** `https://dealdoor.co/explore/[category]?sort=expiring`

**Query params:**
| Param | Values | Default | Description |
|-------|--------|---------|-------------|
| `q` | string | - | Search query |
| `category` | enum | all | Filter by category |
| `sort` | newest, expiring, popular | newest | Sort order |
| `lat` | number | - | User latitude |
| `lng` | number | - | User longitude |

### 3.4 Dashboard URL

```
https://dealdoor.co/dashboard
https://dealdoor.co/dashboard/deals
https://dealdoor.co/dashboard/menu
https://dealdoor.co/dashboard/settings
https://dealdoor.co/dashboard/preview
```

**Note:** Dashboard is behind authentication in future. For MVP prototype, accessible directly.

---

## 4. Astro File Structure

```
src/
├── pages/
│   ├── index.astro                    → /
│   ├── explore/
│   │   ├── index.astro                → /explore
│   │   └── [category].astro           → /explore/[category]
│   ├── [slug].astro                   → /[slug] (shop page)
│   └── dashboard/
│       ├── index.astro                → /dashboard
│       ├── deals.astro                → /dashboard/deals
│       ├── menu.astro                 → /dashboard/menu
│       ├── settings.astro             → /dashboard/settings
│       └── preview.astro              → /dashboard/preview
├── components/
│   ├── shop/
│   │   ├── ShopHeader.astro
│   │   ├── DealCard.astro
│   │   ├── DealDetailModal.astro
│   │   ├── MenuList.astro
│   │   ├── ShopInfo.astro
│   │   ├── MapPreview.astro
│   │   └── ContactButtons.astro
│   ├── explore/
│   │   ├── ExploreFeed.astro
│   │   ├── CategoryChips.astro
│   │   ├── SearchBar.astro
│   │   └── ExpiringSoon.astro
│   ├── dashboard/
│   │   ├── ShopForm.astro
│   │   ├── DealForm.astro
│   │   ├── DealList.astro
│   │   ├── MenuForm.astro
│   │   └── ShareLink.astro
│   └── shared/
│       ├── Header.astro
│       ├── Footer.astro
│       ├── CountdownBadge.astro
│       ├── CategoryBadge.astro
│       ├── Toast.astro
│       └── Skeleton.astro
├── layouts/
│   ├── BaseLayout.astro
│   ├── ShopLayout.astro
│   └── DashboardLayout.astro
├── lib/
│   ├── db.ts
│   ├── utils.ts
│   └── constants.ts
└── styles/
    └── global.css
```

---

## 5. Dynamic Route Handling

### 5.1 Shop Page (`/[slug].astro`)

```typescript
// src/pages/[slug].astro
import { getShopBySlug, getDealsByShopId, getMenuByShopId } from '../lib/db';

export async function getStaticPaths() {
  const shops = await getAllShops();
  return shops.map(shop => ({
    params: { slug: shop.slug },
  }));
}

const { slug } = Astro.params;
const shop = await getShopBySlug(slug);

if (!shop) {
  return Astro.redirect('/404');
}

const deals = await getDealsByShopId(shop.id);
const menuItems = await getMenuByShopId(shop.id);

// Check for deal deep link
const dealId = Astro.url.searchParams.get('deal');
const highlightedDeal = dealId ? deals.find(d => d.id === dealId) : null;
```

### 5.2 Explore Category (`/explore/[category].astro`)

```typescript
// src/pages/explore/[category].astro
export async function getStaticPaths() {
  return SHOP_CATEGORIES.map(category => ({
    params: { category },
  }));
}

const { category } = Astro.params;
const sort = Astro.url.searchParams.get('sort') || 'newest';
const query = Astro.url.searchParams.get('q') || '';
```

---

## 6. SEO & Meta Tags

### 6.1 Shop Page Meta

```html
<title>{shop.name} — โปรโมชันล่าสุด | DealDoor</title>
<meta name="description" content="{shop.description} ดูโปรโมชันล่าสุด ส่วนลด และดีลพิเศษจาก {shop.name}" />

<!-- Open Graph -->
<meta property="og:title" content="{shop.name} — โปรโมชันล่าสุด" />
<meta property="og:description" content="{shop.description}" />
<meta property="og:image" content="{shop.coverImage}" />
<meta property="og:url" content="https://dealdoor.co/{shop.slug}" />
<meta property="og:type" content="business.business" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="{shop.name} — โปรโมชันล่าสุด" />
<meta name="twitter:description" content="{shop.description}" />
<meta name="twitter:image" content="{shop.coverImage}" />
```

### 6.2 Deal Deep Link Meta

```html
<title>{deal.title} — {shop.name} | DealDoor</title>
<meta name="description" content="{deal.shortDescription} หมดอายุ: {formatDate(deal.endDate)}" />
<meta property="og:title" content="{deal.title} — {shop.name}" />
<meta property="og:description" content="{deal.shortDescription}" />
```

---

## 7. Share URL Formats

### 7.1 Shop Share

```
https://dealdoor.co/moon-bowl-cafe
```

**LINE share text:**
```
ดูโปรล่าสุดของร้าน Moon Bowl Cafe ได้ที่นี่: https://dealdoor.co/moon-bowl-cafe
```

### 7.2 Deal Share

```
https://dealdoor.co/moon-bowl-cafe?deal=deal_001
```

**LINE share text:**
```
🎂 Birthday Month Free Brownie จาก Moon Bowl Cafe
ฟรีบราวนี่ เมื่อสั่งเครื่องดื่ม
หมดอายุ: 31 ก.ค. 68
ดูเพิ่มเติม: https://dealdoor.co/moon-bowl-cafe?deal=deal_001
```

### 7.3 Facebook Share URL

```
https://www.facebook.com/sharer/sharer.php?u=https://dealdoor.co/moon-bowl-cafe
```

### 7.4 LINE Share URL

```
https://social-plugins.line.me/lineit/share?url=https://dealdoor.co/moon-bowl-cafe
```

---

## 8. Redirect Rules

| From | To | Status |
|------|----|--------|
| `/shop/[slug]` | `/[slug]` | 301 |
| `/shops` | `/explore` | 301 |
| `/deals` | `/explore` | 301 |
| `/store/[slug]` | `/[slug]` | 301 |

---

## 9. Slug Change & Redirect Handling

### 9.1 Problem

When a merchant changes their shop slug (e.g., `moon-cafe` → `moon-bowl-cafe`), old shared links break.

### 9.2 Solution: Slug History Table

```typescript
// db/schema.ts (additions)

export const slugHistory = sqliteTable('slug_history', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  shopId: text('shop_id').notNull().references(() => shops.id),
  oldSlug: text('old_slug').notNull(),
  newSlug: text('new_slug').notNull(),
  changedAt: integer('changed_at', { mode: 'timestamp' }).notNull(),
});

// Index for fast lookup
export const slugHistoryIndex = index('slug_history_old_slug_idx').on(slugHistory.oldSlug);
```

### 9.3 Slug Change Flow

```
Merchant changes slug in dashboard →
  ├── Validate new slug (unique, format)
  ├── Save old slug to slug_history table
  ├── Update shop.slug to new slug
  └── Old slug now redirects to new slug (301)
```

### 9.4 Redirect Middleware

```typescript
// src/middleware.ts

import { defineMiddleware } from 'astro:middleware';
import { db } from './lib/db';
import { slugHistory } from '../db/schema';
import { eq } from 'drizzle-orm';

export const onRequest = defineMiddleware(async (context, next) => {
  const path = context.url.pathname;
  
  // Only check shop page routes (single segment, no /api/, /dashboard/, etc.)
  const slug = path.slice(1); // Remove leading /
  if (slug && !slug.includes('/') && !slug.startsWith('api') && !slug.startsWith('dashboard')) {
    // Check if this slug is an old slug
    const oldSlugRecord = await db.query.slugHistory.findFirst({
      where: eq(slugHistory.oldSlug, slug),
    });
    
    if (oldSlugRecord) {
      // 301 redirect to new slug
      return context.redirect(`/${oldSlugRecord.newSlug}`, 301);
    }
  }
  
  return next();
});
```

### 9.5 API for Changing Slug

```typescript
// src/pages/api/shops/[id]/slug.ts

import type { APIRoute } from 'astro';
import { updateShopSlug, getShopBySlug } from '../../../../lib/queries';
import { createSlugHistory } from '../../../../lib/mutations';
import { validateShopSlug } from '../../../../lib/validations';
import { conflict, badRequest } from '../../../../lib/errors';

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const { newSlug } = await request.json();
    const shopId = params.id!;
    
    // Validate slug format
    if (!validateShopSlug(newSlug)) {
      throw badRequest('INVALID_SLUG', 'ลิงก์ไม่ถูกต้อง ใช้ได้เฉพาะตัวอักษรภาษาอังกฤษ ตัวเลข และ -');
    }
    
    // Check if new slug is already taken
    const existingShop = await getShopBySlug(newSlug);
    if (existingShop && existingShop.id !== shopId) {
      throw conflict('SLUG_TAKEN', 'ลิงก์นี้ถูกใช้แล้ว', { slug: newSlug });
    }
    
    // Get current slug
    const currentShop = await getShopById(shopId);
    if (!currentShop) {
      throw new ApiError(404, 'NOT_FOUND', 'ไม่พบข้อมูลร้าน');
    }
    
    // Save old slug to history
    if (currentShop.slug !== newSlug) {
      await createSlugHistory({
        shopId,
        oldSlug: currentShop.slug,
        newSlug,
        changedAt: new Date(),
      });
    }
    
    // Update slug
    await updateShopSlug(shopId, newSlug);
    
    return new Response(
      JSON.stringify({ success: true, data: { slug: newSlug } }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return handleApiError(error);
  }
};
```

### 9.6 Slug History Cleanup

```typescript
// Optional: Clean up old slug records after X months

export async function cleanupOldSlugs(monthsOld: number = 12): Promise<void> {
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - monthsOld);
  
  await db.delete(slugHistory)
    .where(sql`${slugHistory.changedAt} < ${cutoffDate}`);
}
```

### 9.7 Best Practices

| Practice | Description |
|----------|-------------|
| Keep redirects forever | Don't delete slug history for active shops |
| Use 301 (permanent) | Tells browsers/SEO the move is permanent |
| Update shared links | Show merchants a warning when changing slug |
| Limit changes | Max 1 slug change per month (prevent abuse) |
| Preserve SEO | Google will transfer ranking to new URL |

### 9.8 Merchant UI Warning

```tsx
// Shown when merchant tries to change slug

function SlugChangeWarning({ currentSlug }: { currentSlug: string }) {
  return (
    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
      <h3 className="font-medium text-yellow-800">⚠️ เปลี่ยนลิงก์หน้าร้าน</h3>
      <p className="mt-1 text-sm text-yellow-700">
        ลิงก์เก่า ({currentSlug}) จะยังใช้ได้ แต่จะเปลี่ยนเส้นทางไปหน้าใหม่โดยอัตโนมัติ
      </p>
      <ul className="mt-2 list-inside list-disc text-sm text-yellow-700">
        <li>ลิงก์ที่เคยแชร์ไปแล้วยังใช้ได้</li>
        <li>QR Code เก่ายังใช้ได้</li>
        <li>แนะนำให้แจ้งลูกค้าเกี่ยวกับลิงก์ใหม่</li>
      </ul>
    </div>
  );
}
```

### 9.9 URL Structure for Redirects

| Scenario | Old URL | New URL | Behavior |
|----------|---------|---------|----------|
| Slug change | `/moon-cafe` | `/moon-bowl-cafe` | 301 redirect |
| Deep link preserved | `/moon-cafe?deal=123` | `/moon-bowl-cafe?deal=123` | 301 + preserve query |
| Invalid slug | `/non-existent` | - | 404 page |
| Expired shop | `/old-shop` | - | 404 with message |

---

## 10. Error Pages

| Code | Page | Description |
|------|------|-------------|
| 404 | Not Found | Shop or page not found |
| 500 | Server Error | Something went wrong |

### 404 Page Content

```
┌─────────────────────────────────┐
│                                 │
│        🔍                       │
│   ไม่พบหน้าที่คุณค้นหา         │
│                                 │
│   ร้านนี้อาจยังไม่มีในระบบ      │
│   หรือลิงก์อาจไม่ถูกต้อง        │
│                                 │
│   [กลับหน้าแรก] [ค้นหาดีล]    │
│                                 │
└─────────────────────────────────┘
```

---

## 10. Sitemap

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://dealdoor.co/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://dealdoor.co/explore</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <!-- Dynamic shop pages -->
  <url>
    <loc>https://dealdoor.co/moon-bowl-cafe</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <!-- ... more shops ... -->
</urlset>
```
