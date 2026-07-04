# DealDoor — Error & Edge Cases Design

---

## 1. Overview

This document defines how DealDoor handles errors, edge cases, and unexpected states.

---

## 2. Error Categories

| Category | Examples | User Impact |
|----------|----------|-------------|
| Network | Offline, timeout, DNS failure | Cannot load page |
| Server | 500 errors, database failure | Page unavailable |
| Client | Invalid input, validation errors | Cannot complete action |
| Data | Missing shop, expired deal | Content not found |
| Permission | Unauthorized, forbidden | Access denied |

---

## 3. HTTP Error Pages

### 3.1 404 — Not Found

```astro
---
// src/pages/404.astro
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout title="ไม่พบหน้า">
  <div class="flex min-h-screen items-center justify-center px-4">
    <div class="text-center">
      <span class="text-6xl">🔍</span>
      <h1 class="mt-4 text-2xl font-bold text-secondary">ไม่พบหน้าที่คุณค้นหา</h1>
      <p class="mt-2 text-gray-500">
        ร้านนี้อาจยังไม่มีในระบบ หรือลิงก์อาจไม่ถูกต้อง
      </p>
      <div class="mt-6 flex justify-center gap-3">
        <a href="/" class="rounded-lg bg-primary px-4 py-2 text-white">
          กลับหน้าแรก
        </a>
        <a href="/explore" class="rounded-lg border px-4 py-2 text-gray-600">
          ค้นหาดีล
        </a>
      </div>
    </div>
  </div>
</BaseLayout>
```

### 3.2 500 — Server Error

```astro
---
// src/pages/500.astro
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout title="เกิดข้อผิดพลาด">
  <div class="flex min-h-screen items-center justify-center px-4">
    <div class="text-center">
      <span class="text-6xl">⚠️</span>
      <h1 class="mt-4 text-2xl font-bold text-secondary">เกิดข้อผิดพลาด</h1>
      <p class="mt-2 text-gray-500">
        กรุณาลองใหม่อีกครั้ง หากยังไม่หาย กรุณาติดต่อเรา
      </p>
      <div class="mt-6">
        <button
          onclick="window.location.reload()"
          class="rounded-lg bg-primary px-4 py-2 text-white"
        >
          ลองใหม่
        </button>
      </div>
    </div>
  </div>
</BaseLayout>
```

### 3.3 403 — Forbidden

```astro
---
// src/pages/403.astro
---

<BaseLayout title="ไม่มีสิทธิ์เข้าถึง">
  <div class="flex min-h-screen items-center justify-center px-4">
    <div class="text-center">
      <span class="text-6xl">🔒</span>
      <h1 class="mt-4 text-2xl font-bold text-secondary">ไม่มีสิทธิ์เข้าถึง</h1>
      <p class="mt-2 text-gray-500">
        คุณไม่มีสิทธิ์เข้าถึงหน้านี้
      </p>
      <div class="mt-6">
        <a href="/" class="rounded-lg bg-primary px-4 py-2 text-white">
          กลับหน้าแรก
        </a>
      </div>
    </div>
  </div>
</BaseLayout>
```

---

## 4. Shop Page Edge Cases

### 4.1 Shop Not Found

```astro
---
// In [slug].astro
const shop = await getShopBySlug(slug);

if (!shop) {
  return Astro.redirect('/404');
}
---
```

### 4.2 Shop Has No Deals

```astro
{activeDeals.length === 0 ? (
  <div class="rounded-xl border border-dashed p-8 text-center">
    <span class="text-4xl">📋</span>
    <h3 class="mt-2 text-lg font-medium text-secondary">ยังไม่มีโปรโมชัน</h3>
    <p class="mt-1 text-sm text-gray-500">ร้านนี้ยังไม่ได้เพิ่มดีล</p>
  </div>
) : (
  <div class="space-y-4">
    {activeDeals.map(deal => <DealCard deal={deal} />)}
  </div>
)}
```

### 4.3 Shop Has No Menu

```astro
{menuItems.length > 0 && (
  <section>
    <h2>เมนู / แคตตาล็อก</h2>
    <!-- Menu items -->
  </section>
)}
```

### 4.4 Shop Has No Images

```astro
<div class="h-48 overflow-hidden bg-gradient-to-br from-primary-light to-orange-100">
  {shop.coverImage ? (
    <img src={shop.coverImage} alt={shop.name} class="h-full w-full object-cover" />
  ) : (
    <div class="flex h-full items-center justify-center">
      <span class="text-5xl">🏪</span>
    </div>
  )}
</div>
```

### 4.5 Shop Has No Contact Info

```astro
<ContactButtons shop={shop} />

<!-- In ContactButtons.tsx -->
{buttons.length === 0 && (
  <p class="text-sm text-gray-400">ยังไม่มีช่องทางติดต่อ</p>
)}
```

---

## 5. Deal Edge Cases

### 5.1 Expired Deals

```typescript
// src/lib/utils.ts

export function getDealStatus(deal: Deal): 'active' | 'expiring_soon' | 'expired' {
  const now = new Date();
  const end = new Date(deal.endDate);
  const hoursLeft = (end.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (!deal.isActive || end < now) return 'expired';
  if (hoursLeft <= 24) return 'expiring_soon';
  return 'active';
}
```

```astro
<!-- In DealCard.astro -->
{status === 'expired' && (
  <div class="absolute inset-0 flex items-center justify-center bg-white/90">
    <div class="text-center">
      <span class="rounded-full bg-gray-200 px-4 py-2 text-sm font-medium text-gray-600">
        หมดอายุแล้ว
      </span>
    </div>
  </div>
)}
```

### 5.2 Deal Expiring Today

```astro
{status === 'expiring_soon' && hoursLeft <= 24 && (
  <span class="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 animate-pulse">
    ⏰ หมดอายุวันนี้
  </span>
)}
```

### 5.3 Deal Without Coupon Code

```astro
{deal.claimType === 'copy_code' && deal.couponCode ? (
  <button class="copy-code-btn" data-code={deal.couponCode}>
    คัดลอกโค้ด
  </button>
) : deal.claimType === 'show_at_shop' ? (
  <button class="show-at-shop-btn">
    แสดงที่ร้าน
  </button>
) : deal.claimType === 'open_line' && shop.lineId ? (
  <a href={`https://line.me/ti/p/${shop.lineId}`}>
    เปิด LINE
  </a>
) : (
  <button class="contact-shop-btn">
    ติดต่อร้าน
  </button>
)}
```

### 5.4 Deal Without Description

```astro
{deal.description && (
  <p class="mt-2 text-sm text-gray-600">{deal.description}</p>
)}
{!deal.description && deal.shortDescription && (
  <p class="mt-2 text-sm text-gray-600">{deal.shortDescription}</p>
)}
```

---

## 6. Form Validation Errors

### 6.1 Inline Error Messages

```tsx
// src/components/shared/FormField.tsx

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

export default function FormField({ label, error, required, children }: FormFieldProps) {
  return (
    <div>
      <label class="block text-sm font-medium text-text-primary">
        {label}
        {required && <span class="text-red-500">*</span>}
      </label>
      <div class="mt-1">
        {children}
      </div>
      {error && (
        <p class="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
```

### 6.2 Validation Rules

```typescript
// src/lib/validations.ts

export interface ValidationError {
  field: string;
  message: string;
}

export function validateShop(data: ShopInput): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.name || data.name.length < 2) {
    errors.push({ field: 'name', message: 'ชื่อร้านต้องมีอย่างน้อย 2 ตัวอักษร' });
  }
  if (data.name && data.name.length > 50) {
    errors.push({ field: 'name', message: 'ชื่อร้านต้องไม่เกิน 50 ตัวอักษร' });
  }
  if (!data.category) {
    errors.push({ field: 'category', message: 'กรุณาเลือกประเภทร้าน' });
  }
  if (data.phone && !isValidPhone(data.phone)) {
    errors.push({ field: 'phone', message: 'รูปแบบเบอร์โทรไม่ถูกต้อง' });
  }

  return errors;
}

export function validateDeal(data: DealInput): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.title || data.title.length < 2) {
    errors.push({ field: 'title', message: 'ชื่อดีลต้องมีอย่างน้อย 2 ตัวอักษร' });
  }
  if (!data.category) {
    errors.push({ field: 'category', message: 'กรุณาเลือกหมวดหมู่' });
  }
  if (!data.discountText) {
    errors.push({ field: 'discountText', message: 'กรุณากรอกส่วนลดหรือผลประโยชน์' });
  }
  if (!data.endDate) {
    errors.push({ field: 'endDate', message: 'กรุณาเลือกวันหมดอายุ' });
  }
  if (data.endDate && new Date(data.endDate) < new Date()) {
    errors.push({ field: 'endDate', message: 'วันหมดอายุต้องเป็นวันในอนาคต' });
  }
  if (data.couponCode && !isValidCouponCode(data.couponCode)) {
    errors.push({ field: 'couponCode', message: 'โค้ดต้องเป็นตัวอักษรภาษาอังกฤษและตัวเลขเท่านั้น' });
  }

  return errors;
}

function isValidPhone(phone: string): boolean {
  return /^[0-9-]{9,12}$/.test(phone);
}

function isValidCouponCode(code: string): boolean {
  return /^[A-Z0-9-]+$/.test(code);
}
```

---

## 7. Network Error Handling

### 7.1 Offline Detection

```typescript
// src/lib/network.ts

export function isOnline(): boolean {
  return navigator.onLine;
}

export function onOnlineStatusChange(callback: (online: boolean) => void): () => void {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}
```

### 7.2 Offline Banner

```astro
---
// src/components/shared/OfflineBanner.astro
---

<div
  id="offline-banner"
  class="fixed bottom-0 left-0 right-0 z-50 hidden bg-yellow-500 p-2 text-center text-sm text-white"
>
  ⚠️ คุณกำลังออฟไลน์ บางฟีเจอร์อาจไม่ทำงาน
</div>

<script>
  const banner = document.getElementById('offline-banner');

  window.addEventListener('offline', () => {
    banner?.classList.remove('hidden');
  });

  window.addEventListener('online', () => {
    banner?.classList.add('hidden');
  });

  if (!navigator.onLine) {
    banner?.classList.remove('hidden');
  }
</script>
```

### 7.3 API Error Handling

```typescript
// src/lib/api-client.ts

interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

export async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      return {
        error: error.error || `HTTP ${response.status}`,
        status: response.status,
      };
    }

    const data = await response.json();
    return { data, status: response.status };
  } catch (error) {
    if (!navigator.onLine) {
      return { error: 'คุณกำลังออฟไลน์', status: 0 };
    }
    return { error: 'เกิดข้อผิดพลาด กรุณาลองใหม่', status: 0 };
  }
}
```

---

## 8. Toast Notifications

### 8.1 Success Toast

```typescript
showToast('บันทึกสำเร็จ', 'success');
```

### 8.2 Error Toast

```typescript
showToast('บันทึกไม่สำเร็จ กรุณาลองใหม่', 'error');
```

### 8.3 Warning Toast

```typescript
showToast('คุณใช้ดีลครบแล้ว', 'warning');
```

### 8.4 Implementation

```typescript
// src/lib/toast.ts

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export function showToast(message: string, type: ToastType = 'info', duration = 3000): void {
  const container = document.getElementById('toast-container') || createToastContainer();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

function createToastContainer(): HTMLElement {
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.className = 'fixed top-4 right-4 z-50 flex flex-col gap-2';
  document.body.appendChild(container);
  return container;
}
```

---

## 9. Loading States

### 9.1 Skeleton Loader

```astro
---
// src/components/shared/Skeleton.astro

interface Props {
  width?: string;
  height?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
}

const { width = 'w-full', height = 'h-4', rounded = 'md' } = Astro.props;
---

<div class:list={['animate-pulse bg-gray-200 dark:bg-gray-700', width, height, `rounded-${rounded}`]} />
```

### 9.2 Page Skeleton

```astro
---
// Shop page loading skeleton
---

<div class="space-y-4">
  <Skeleton width="w-full" height="h-48" rounded="lg" />
  <Skeleton width="w-1/2" height="h-6" />
  <Skeleton width="w-3/4" height="h-4" />
  <div class="space-y-3">
    <Skeleton width="w-full" height="h-32" rounded="lg" />
    <Skeleton width="w-full" height="h-32" rounded="lg" />
  </div>
</div>
```

### 9.3 Button Loading State

```tsx
<button
  disabled={loading}
  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white disabled:opacity-50"
>
  {loading && (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )}
  {loading ? 'กำลังบันทึก...' : 'บันทึก'}
</button>
```

---

## 10. Empty States

### 10.1 No Deals

```astro
<div class="rounded-xl border border-dashed p-8 text-center">
  <span class="text-4xl">📋</span>
  <h3 class="mt-2 text-lg font-medium">ยังไม่มีโปรโมชัน</h3>
  <p class="mt-1 text-sm text-gray-500">ร้านนี้ยังไม่ได้เพิ่มดีล</p>
</div>
```

### 10.2 No Search Results

```astro
<div class="rounded-xl border border-dashed p-8 text-center">
  <span class="text-4xl">🔍</span>
  <h3 class="mt-2 text-lg font-medium">ไม่พบผลลัพธ์</h3>
  <p class="mt-1 text-sm text-gray-500">ลองค้นหาด้วยคำอื่น</p>
</div>
```

### 10.3 No Shops in Category

```astro
<div class="rounded-xl border border-dashed p-8 text-center">
  <span class="text-4xl">🏪</span>
  <h3 class="mt-2 text-lg font-medium">ยังไม่มีร้านในหมวดนี้</h3>
  <p class="mt-1 text-sm text-gray-500">กลับมาดูใหม่เร็วๆ นี้</p>
</div>
```

---

## 11. Edge Case Matrix

| Scenario | Handling |
|----------|----------|
| Shop deleted | 404 page |
| Deal expired | Grayed out, "หมดอายุแล้ว" badge |
| No deals | Empty state message |
| No menu | Hide menu section |
| No images | Show placeholder |
| No contact info | Hide contact buttons |
| Invalid coupon code | Show error toast |
| Network offline | Offline banner |
| Server error | 500 page |
| Unauthorized | Redirect to login |
| Rate limited | Show "ลองใหม่ภายหลัง" |
| Duplicate slug | Append random suffix |

---

## 12. File Structure

```
src/
├── pages/
│   ├── 404.astro
│   ├── 500.astro
│   └── 403.astro
├── components/
│   └── shared/
│       ├── OfflineBanner.astro
│       ├── Toast.tsx
│       ├── Skeleton.astro
│       ├── EmptyState.astro
│       └── FormField.tsx
└── lib/
    ├── validations.ts
    ├── network.ts
    ├── api-client.ts
    └── toast.ts
```
