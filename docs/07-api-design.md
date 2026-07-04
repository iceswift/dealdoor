# DealDoor — API & Server Design

---

## 1. Architecture Overview

DealDoor uses Astro's built-in server capabilities:
- **SSR Pages** for dynamic content (shop pages, explore)
- **API Routes** for dashboard CRUD operations
- **Direct DB queries** via Drizzle ORM

---

## 2. Database Query Functions

### File: `src/lib/queries.ts`

```typescript
import { db } from './db';
import { shops, deals, menuItems, merchants } from '../../db/schema';
import { eq, and, gte, lte, desc, asc, sql } from 'drizzle-orm';

// ─── Shop Queries ─────────────────────────────────────────

export async function getShopBySlug(slug: string) {
  return db.query.shops.findFirst({
    where: eq(shops.slug, slug),
    with: {
      deals: {
        orderBy: [desc(deals.createdAt)],
      },
      menuItems: {
        orderBy: [asc(menuItems.sortOrder)],
      },
    },
  });
}

export async function getAllShops() {
  return db.query.shops.findMany({
    orderBy: [desc(shops.createdAt)],
  });
}

export async function getShopsByCategory(category: string) {
  return db.query.shops.findMany({
    where: eq(shops.category, category),
    orderBy: [desc(shops.createdAt)],
  });
}

export async function getShopById(id: string) {
  return db.query.shops.findFirst({
    where: eq(shops.id, id),
  });
}

// ─── Deal Queries ─────────────────────────────────────────

export async function getActiveDealsByShopId(shopId: string) {
  const now = new Date();
  return db.query.deals.findMany({
    where: and(
      eq(deals.shopId, shopId),
      eq(deals.isActive, true),
      gte(deals.endDate, now)
    ),
    orderBy: [asc(deals.endDate)],
  });
}

export async function getAllDealsByShopId(shopId: string) {
  return db.query.deals.findMany({
    where: eq(deals.shopId, shopId),
    orderBy: [desc(deals.createdAt)],
  });
}

export async function getExpiringSoonDeals(limit = 10) {
  const now = new Date();
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  return db.query.deals.findMany({
    where: and(
      eq(deals.isActive, true),
      gte(deals.endDate, now),
      lte(deals.endDate, in7Days)
    ),
    with: {
      shop: true,
    },
    orderBy: [asc(deals.endDate)],
    limit,
  });
}

export async function getAllActiveDeals(limit = 50) {
  const now = new Date();
  return db.query.deals.findMany({
    where: and(
      eq(deals.isActive, true),
      gte(deals.endDate, now)
    ),
    with: {
      shop: true,
    },
    orderBy: [desc(deals.createdAt)],
    limit,
  });
}

export async function getDealsByCategory(category: string) {
  const now = new Date();
  return db.query.deals.findMany({
    where: and(
      eq(deals.category, category),
      eq(deals.isActive, true),
      gte(deals.endDate, now)
    ),
    with: {
      shop: true,
    },
    orderBy: [asc(deals.endDate)],
  });
}

export async function searchDeals(query: string) {
  const now = new Date();
  return db.query.deals.findMany({
    where: and(
      eq(deals.isActive, true),
      gte(deals.endDate, now),
      sql`${deals.title} LIKE ${`%${query}%`} OR ${deals.description} LIKE ${`%${query}%`}`
    ),
    with: {
      shop: true,
    },
    orderBy: [desc(deals.createdAt)],
  });
}

// ─── Menu Queries ─────────────────────────────────────────

export async function getMenuByShopId(shopId: string) {
  return db.query.menuItems.findMany({
    where: eq(menuItems.shopId, shopId),
    orderBy: [asc(menuItems.sortOrder)],
  });
}

// ─── Merchant Queries ─────────────────────────────────────

export async function getMerchantById(id: string) {
  return db.query.merchants.findFirst({
    where: eq(merchants.id, id),
  });
}

export async function getMerchantShops(merchantId: string) {
  return db.query.shops.findMany({
    where: eq(shops.merchantId, merchantId),
  });
}
```

---

## 3. Mutation Functions

### File: `src/lib/mutations.ts`

```typescript
import { db } from './db';
import { shops, deals, menuItems } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

// ─── Shop Mutations ───────────────────────────────────────

export async function createShop(data: typeof shops.$inferInsert) {
  const id = createId();
  await db.insert(shops).values({
    ...data,
    id,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return id;
}

export async function updateShop(id: string, data: Partial<typeof shops.$inferInsert>) {
  await db.update(shops)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(shops.id, id));
}

// ─── Deal Mutations ───────────────────────────────────────

export async function createDeal(data: typeof deals.$inferInsert) {
  const id = createId();
  await db.insert(deals).values({
    ...data,
    id,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return id;
}

export async function updateDeal(id: string, data: Partial<typeof deals.$inferInsert>) {
  await db.update(deals)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(deals.id, id));
}

export async function deleteDeal(id: string) {
  await db.delete(deals).where(eq(deals.id, id));
}

export async function toggleDealActive(id: string, isActive: boolean) {
  await db.update(deals)
    .set({
      isActive,
      updatedAt: new Date(),
    })
    .where(eq(deals.id, id));
}

// ─── Menu Mutations ───────────────────────────────────────

export async function createMenuItem(data: typeof menuItems.$inferInsert) {
  const id = createId();
  await db.insert(menuItems).values({
    ...data,
    id,
    createdAt: new Date(),
  });
  return id;
}

export async function updateMenuItem(id: string, data: Partial<typeof menuItems.$inferInsert>) {
  await db.update(menuItems)
    .set(data)
    .where(eq(menuItems.id, id));
}

export async function deleteMenuItem(id: string) {
  await db.delete(menuItems).where(eq(menuItems.id, id));
}
```

---

## 4. Astro API Routes

### 4.1 Shop API

**File:** `src/pages/api/shops/[id].ts`

```typescript
import type { APIRoute } from 'astro';
import { getShopById, updateShop } from '../../../lib/queries';
import { updateShop as updateShopMutation } from '../../../lib/mutations';

export const GET: APIRoute = async ({ params }) => {
  const shop = await getShopById(params.id!);
  
  if (!shop) {
    return new Response(JSON.stringify({ error: 'Shop not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(shop), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const PUT: APIRoute = async ({ params, request }) => {
  const data = await request.json();
  await updateShopMutation(params.id!, data);
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
```

### 4.2 Deal API

**File:** `src/pages/api/deals/index.ts`

```typescript
import type { APIRoute } from 'astro';
import { createDeal } from '../../../lib/mutations';

export const POST: APIRoute = async ({ request }) => {
  const data = await request.json();
  
  const id = await createDeal({
    shopId: data.shopId,
    title: data.title,
    category: data.category,
    description: data.description,
    shortDescription: data.shortDescription,
    discountText: data.discountText,
    conditions: data.conditions,
    couponCode: data.couponCode,
    claimType: data.claimType,
    imageUrl: data.imageUrl,
    startDate: data.startDate ? new Date(data.startDate) : null,
    endDate: new Date(data.endDate),
    isActive: true,
  });

  return new Response(JSON.stringify({ id, success: true }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
```

**File:** `src/pages/api/deals/[id].ts`

```typescript
import type { APIRoute } from 'astro';
import { updateDeal, deleteDeal, toggleDealActive } from '../../../lib/mutations';

export const PUT: APIRoute = async ({ params, request }) => {
  const data = await request.json();
  await updateDeal(params.id!, data);
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const DELETE: APIRoute = async ({ params }) => {
  await deleteDeal(params.id!);
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const PATCH: APIRoute = async ({ params, request }) => {
  const { isActive } = await request.json();
  await toggleDealActive(params.id!, isActive);
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
```

### 4.3 Menu API

**File:** `src/pages/api/menu/index.ts`

```typescript
import type { APIRoute } from 'astro';
import { createMenuItem } from '../../../lib/mutations';

export const POST: APIRoute = async ({ request }) => {
  const data = await request.json();
  
  const id = await createMenuItem({
    shopId: data.shopId,
    name: data.name,
    price: data.price,
    description: data.description,
    imageUrl: data.imageUrl,
    sortOrder: data.sortOrder || 0,
  });

  return new Response(JSON.stringify({ id, success: true }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
```

**File:** `src/pages/api/menu/[id].ts`

```typescript
import type { APIRoute } from 'astro';
import { updateMenuItem, deleteMenuItem } from '../../../lib/mutations';

export const PUT: APIRoute = async ({ params, request }) => {
  const data = await request.json();
  await updateMenuItem(params.id!, data);
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const DELETE: APIRoute = async ({ params }) => {
  await deleteMenuItem(params.id!);
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
```

---

## 5. API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/shops/:id` | Get shop by ID |
| PUT | `/api/shops/:id` | Update shop |
| POST | `/api/deals` | Create new deal |
| PUT | `/api/deals/:id` | Update deal |
| DELETE | `/api/deals/:id` | Delete deal |
| PATCH | `/api/deals/:id` | Toggle deal active status |
| POST | `/api/menu` | Create menu item |
| PUT | `/api/menu/:id` | Update menu item |
| DELETE | `/api/menu/:id` | Delete menu item |

---

## 6. SSR Page Data Loading

### 6.1 Shop Page

```typescript
// src/pages/[slug].astro
---
import { getShopBySlug } from '../lib/queries';
import { getDealStatus } from '../lib/utils';

export const prerender = false;

const { slug } = Astro.params;
const shop = await getShopBySlug(slug);

if (!shop) {
  return Astro.redirect('/404');
}

const now = new Date();
const activeDeals = shop.deals.filter(d => 
  d.isActive && new Date(d.endDate) >= now
);
const expiredDeals = shop.deals.filter(d => 
  !d.isActive || new Date(d.endDate) < now
);

// Check for deal deep link
const dealId = Astro.url.searchParams.get('deal');
const highlightedDeal = dealId ? shop.deals.find(d => d.id === dealId) : null;
---

<!-- Page content -->
```

### 6.2 Explore Page

```typescript
// src/pages/explore/index.astro
---
import { getAllActiveDeals, getExpiringSoonDeals } from '../../lib/queries';

export const prerender = false;

const allDeals = await getAllActiveDeals(50);
const expiringSoon = await getExpiringSoonDeals(10);

// Group by shop
const dealsByShop = new Map();
allDeals.forEach(deal => {
  if (!dealsByShop.has(deal.shopId)) {
    dealsByShop.set(deal.shopId, {
      shop: deal.shop,
      deals: [],
    });
  }
  dealsByShop.get(deal.shopId).deals.push(deal);
});
---

<!-- Page content -->
```

---

## 7. Error Handling

```typescript
// src/lib/errors.ts

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function handleApiError(error: unknown): Response {
  if (error instanceof ApiError) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: error.statusCode,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  console.error('Unexpected error:', error);
  return new Response(
    JSON.stringify({ error: 'Internal server error' }),
    {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
```

---

## 8. Validation

```typescript
// src/lib/validations.ts

export function validateShopSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug) && slug.length <= 50;
}

export function validateDealTitle(title: string): boolean {
  return title.length > 0 && title.length <= 100;
}

export function validateEndDate(endDate: string): boolean {
  const date = new Date(endDate);
  return !isNaN(date.getTime()) && date > new Date();
}

export function validateCouponCode(code: string): boolean {
  return /^[A-Z0-9-]+$/.test(code) && code.length <= 30;
}
```

---

## 9. Rate Limiting (Future)

```typescript
// src/lib/rate-limit.ts (future implementation)

const rateLimit = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  key: string,
  limit: number = 100,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const record = rateLimit.get(key);

  if (!record || now > record.resetTime) {
    rateLimit.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}
```

---

## 10. Error Response Format

### 10.1 Standard Error Response

```typescript
// All error responses follow this structure

interface ErrorResponse {
  success: false;
  error: {
    code: string;        // Machine-readable error code
    message: string;     // Human-readable message (Thai)
    details?: any;       // Additional error context
  };
  timestamp: string;     // ISO 8601
}
```

### 10.2 Success Response

```typescript
interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}
```

### 10.3 Status Codes

| Code | Meaning | When to Use |
|------|---------|-------------|
| `200` | OK | Successful GET, PUT, PATCH |
| `201` | Created | Successful POST that creates resource |
| `204` | No Content | Successful DELETE |
| `400` | Bad Request | Invalid input, validation errors |
| `401` | Unauthorized | Missing or invalid auth |
| `403` | Forbidden | Valid auth but no permission |
| `404` | Not Found | Resource doesn't exist |
| `409` | Conflict | Duplicate resource (e.g., slug taken) |
| `422` | Unprocessable Entity | Valid JSON but invalid data |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Unexpected server error |

### 10.4 Error Codes

| Code | HTTP Status | Message (TH) | Message (EN) |
|------|-------------|--------------|--------------|
| `VALIDATION_ERROR` | 400 | ข้อมูลไม่ถูกต้อง | Invalid input |
| `UNAUTHORIZED` | 401 | กรุณาเข้าสู่ระบบ | Please sign in |
| `FORBIDDEN` | 403 | ไม่มีสิทธิ์เข้าถึง | Access denied |
| `NOT_FOUND` | 404 | ไม่พบข้อมูล | Resource not found |
| `SLUG_TAKEN` | 409 | ลิงก์นี้ถูกใช้แล้ว | Slug already in use |
| `DEAL_LIMIT_REACHED` | 422 | ใช้ดีลครบแล้ว | Deal limit reached |
| `INVALID_DATE` | 422 | วันที่ไม่ถูกต้อง | Invalid date |
| `FILE_TOO_LARGE` | 413 | ไฟล์ใหญ่เกินไป | File too large |
| `INVALID_FILE_TYPE` | 422 | ประเภทไฟล์ไม่ถูกต้อง | Invalid file type |
| `RATE_LIMIT_EXCEEDED` | 429 | ลองใหม่ภายหลัง | Try again later |
| `INTERNAL_ERROR` | 500 | เกิดข้อผิดพลาด | Something went wrong |

### 10.5 Error Response Examples

**Validation Error (400):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "ข้อมูลไม่ถูกต้อง",
    "details": [
      { "field": "name", "message": "ชื่อร้านต้องมีอย่างน้อย 2 ตัวอักษร" },
      { "field": "category", "message": "กรุณาเลือกประเภทร้าน" }
    ]
  },
  "timestamp": "2025-07-01T12:00:00Z"
}
```

**Not Found (404):**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "ไม่พบข้อมูล"
  },
  "timestamp": "2025-07-01T12:00:00Z"
}
```

**Slug Taken (409):**
```json
{
  "success": false,
  "error": {
    "code": "SLUG_TAKEN",
    "message": "ลิงก์นี้ถูกใช้แล้ว",
    "details": { "slug": "moon-bowl-cafe" }
  },
  "timestamp": "2025-07-01T12:00:00Z"
}
```

**Deal Limit Reached (422):**
```json
{
  "success": false,
  "error": {
    "code": "DEAL_LIMIT_REACHED",
    "message": "ใช้ดีลครบแล้ว",
    "details": { "current": 6, "max": 6, "tier": "free" }
  },
  "timestamp": "2025-07-01T12:00:00Z"
}
```

### 10.6 Updated Error Handler

```typescript
// src/lib/errors.ts

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function handleApiError(error: unknown): Response {
  if (error instanceof ApiError) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
        timestamp: new Date().toISOString(),
      }),
      {
        status: error.statusCode,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  console.error('Unexpected error:', error);
  return new Response(
    JSON.stringify({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'เกิดข้อผิดพลาด',
      },
      timestamp: new Date().toISOString(),
    }),
    {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

// Helper functions
export function badRequest(code: string, message: string, details?: any) {
  return new ApiError(400, code, message, details);
}

export function unauthorized(message = 'กรุณาเข้าสู่ระบบ') {
  return new ApiError(401, 'UNAUTHORIZED', message);
}

export function forbidden(message = 'ไม่มีสิทธิ์เข้าถึง') {
  return new ApiError(403, 'FORBIDDEN', message);
}

export function notFound(message = 'ไม่พบข้อมูล') {
  return new ApiError(404, 'NOT_FOUND', message);
}

export function conflict(code: string, message: string, details?: any) {
  return new ApiError(409, code, message, details);
}

export function unprocessable(code: string, message: string, details?: any) {
  return new ApiError(422, code, message, details);
}
```

### 10.7 Usage in API Routes

```typescript
export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    
    // Validation
    const errors = validateDeal(data);
    if (errors.length > 0) {
      throw badRequest('VALIDATION_ERROR', 'ข้อมูลไม่ถูกต้อง', errors);
    }

    // Check deal limit
    const shop = await getShopById(data.shopId);
    const activeDeals = await getActiveDealsByShopId(data.shopId);
    if (activeDeals.length >= shop.maxActiveDeals) {
      throw unprocessable('DEAL_LIMIT_REACHED', 'ใช้ดีลครบแล้ว', {
        current: activeDeals.length,
        max: shop.maxActiveDeals,
        tier: shop.tier,
      });
    }

    const id = await createDeal(data);
    
    return new Response(
      JSON.stringify({ success: true, data: { id } }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return handleApiError(error);
  }
};
```
