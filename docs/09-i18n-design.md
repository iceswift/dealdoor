# DealDoor — Internationalization (i18n) Design

---

## 1. Overview

DealDoor supports multiple languages to serve diverse merchants and customers.

### MVP Languages

| Code | Language | Status |
|------|----------|--------|
| `th` | ไทย (Thai) | Primary |
| `en` | English | Secondary |

### Future Languages

| Code | Language | When |
|------|----------|------|
| `zh` | 中文 (Chinese) | Phase 2 |
| `ja` | 日本語 (Japanese) | Phase 2 |
| `ko` | 한국어 (Korean) | Phase 2 |

---

## 2. Architecture

### 2.1 Approach: Astro i18n + JSON namespaces

```
src/
├── i18n/
│   ├── th/
│   │   ├── common.json      # Shared UI text
│   │   ├── shop.json        # Shop page text
│   │   ├── deal.json        # Deal-related text
│   │   ├── dashboard.json   # Dashboard text
│   │   └── explore.json     # Explore page text
│   ├── en/
│   │   ├── common.json
│   │   ├── shop.json
│   │   ├── deal.json
│   │   ├── dashboard.json
│   │   └── explore.json
│   └── index.ts             # i18n config & helpers
```

### 2.2 URL Strategy

| Strategy | Pattern | Example |
|----------|---------|---------|
| Subfolder (recommended) | `/:lang/:path` | `/th/explore`, `/en/explore` |
| Default language | No prefix for `th` | `/explore` (Thai), `/en/explore` (English) |

**Rationale:** Thai is primary market, so no prefix for default language keeps URLs clean for most users.

---

## 3. Translation Files

### 3.1 `src/i18n/th/common.json`

```json
{
  "brand": {
    "name": "DealDoor",
    "tagline": "ดีลไหนดี",
    "description": "หน้าโปรโมชันร้านค้า แชร์ง่าย หมดอายุเอง"
  },
  "nav": {
    "explore": "ดีลใกล้ตัว",
    "createShop": "สร้างหน้าร้าน",
    "dashboard": "แดชบอร์ด",
    "login": "เข้าสู่ระบบ"
  },
  "action": {
    "share": "แชร์",
    "copy": "คัดลอก",
    "copied": "คัดลอกแล้ว",
    "save": "บันทึก",
    "edit": "แก้ไข",
    "delete": "ลบ",
    "cancel": "ยกเลิก",
    "confirm": "ยืนยัน",
    "back": "กลับ",
    "close": "ปิด",
    "viewMore": "ดูเพิ่มเติม",
    "viewAll": "ดูทั้งหมด"
  },
  "status": {
    "open": "เปิดอยู่",
    "closed": "ปิดแล้ว",
    "active": "ใช้งาน",
    "inactive": "ปิดใช้งาน",
    "expired": "หมดอายุแล้ว",
    "expiringSoon": "หมดอายุเร็วๆ นี้"
  },
  "time": {
    "daysLeft": "เหลือ {count} วัน",
    "hoursLeft": "เหลือ {count} ชั่วโมง",
    "expiresToday": "หมดอายุวันนี้",
    "expired": "หมดอายุแล้ว",
    "expiresOn": "หมดอายุ: {date}"
  },
  "category": {
    "restaurant": "ร้านอาหาร",
    "cafe": "คาเฟ่",
    "dessert": "ของหวาน",
    "beauty": "ความงาม",
    "clinic": "คลินิก",
    "retail": "ร้านค้า",
    "service": "บริการ",
    "other": "อื่นๆ"
  },
  "dealCategory": {
    "birthday": "Birthday",
    "monthly": "รายเดือน",
    "festival": "เทศกาล",
    "special_day": "วันพิเศษ",
    "senior": "ผู้สูงอายุ",
    "kids": "เด็ก",
    "student": "นักเรียน/นักศึกษา",
    "flash": "Flash Deal",
    "custom": "ทั่วไป"
  },
  "claimType": {
    "copy_code": "คัดลอกโค้ด",
    "show_at_shop": "แสดงที่ร้าน",
    "contact_shop": "ติดต่อร้าน",
    "open_line": "เปิด LINE"
  },
  "empty": {
    "noDeals": "ยังไม่มีโปรโมชัน",
    "noDealsDesc": "ร้านนี้ยังไม่ได้เพิ่มดีล",
    "noResults": "ไม่พบผลลัพธ์",
    "noResultsDesc": "ลองค้นหาด้วยคำอื่น"
  },
  "error": {
    "notFound": "ไม่พบหน้าที่คุณค้นหา",
    "notFoundDesc": "ร้านนี้อาจยังไม่มีในระบบ หรือลิงก์อาจไม่ถูกต้อง",
    "serverError": "เกิดข้อผิดพลาด",
    "serverErrorDesc": "กรุณาลองใหม่อีกครั้ง"
  }
}
```

### 3.2 `src/i18n/en/common.json`

```json
{
  "brand": {
    "name": "DealDoor",
    "tagline": "Which Deal?",
    "description": "Shareable shop promotion pages with auto-expiring deals"
  },
  "nav": {
    "explore": "Explore Deals",
    "createShop": "Create Shop Page",
    "dashboard": "Dashboard",
    "login": "Sign In"
  },
  "action": {
    "share": "Share",
    "copy": "Copy",
    "copied": "Copied!",
    "save": "Save",
    "edit": "Edit",
    "delete": "Delete",
    "cancel": "Cancel",
    "confirm": "Confirm",
    "back": "Back",
    "close": "Close",
    "viewMore": "View More",
    "viewAll": "View All"
  },
  "status": {
    "open": "Open Now",
    "closed": "Closed",
    "active": "Active",
    "inactive": "Inactive",
    "expired": "Expired",
    "expiringSoon": "Expiring Soon"
  },
  "time": {
    "daysLeft": "{count} days left",
    "hoursLeft": "{count} hours left",
    "expiresToday": "Expires today",
    "expired": "Expired",
    "expiresOn": "Expires: {date}"
  },
  "category": {
    "restaurant": "Restaurant",
    "cafe": "Cafe",
    "dessert": "Dessert",
    "beauty": "Beauty",
    "clinic": "Clinic",
    "retail": "Retail",
    "service": "Service",
    "other": "Other"
  },
  "dealCategory": {
    "birthday": "Birthday",
    "monthly": "Monthly",
    "festival": "Festival",
    "special_day": "Special Day",
    "senior": "Senior",
    "kids": "Kids",
    "student": "Student",
    "flash": "Flash Deal",
    "custom": "General"
  },
  "claimType": {
    "copy_code": "Copy Code",
    "show_at_shop": "Show at Shop",
    "contact_shop": "Contact Shop",
    "open_line": "Open LINE"
  },
  "empty": {
    "noDeals": "No promotions yet",
    "noDealsDesc": "This shop hasn't added any deals",
    "noResults": "No results found",
    "noResultsDesc": "Try searching with different keywords"
  },
  "error": {
    "notFound": "Page not found",
    "notFoundDesc": "This shop may not exist or the link may be incorrect",
    "serverError": "Something went wrong",
    "serverErrorDesc": "Please try again later"
  }
}
```

### 3.3 `src/i18n/th/shop.json`

```json
{
  "shopPage": {
    "activeDeals": "โปรโมชันตอนนี้",
    "menu": "เมนู / แคตตาล็อก",
    "shopInfo": "ข้อมูลร้าน",
    "address": "ที่อยู่",
    "openingHours": "เวลาเปิด-ปิด",
    "phone": "เบอร์โทร",
    "contactChannels": "ช่องทางติดต่อ",
    "openMap": "เปิดแผนที่",
    "directions": "เส้นทาง"
  },
  "merchant": {
    "createdBy": "สร้างโดย DealDoor",
    "createYourPage": "สร้างหน้าร้านของคุณ",
    "freeToStart": "เริ่มต้นฟรี"
  }
}
```

### 3.4 `src/i18n/en/shop.json`

```json
{
  "shopPage": {
    "activeDeals": "Current Deals",
    "menu": "Menu / Catalog",
    "shopInfo": "Shop Information",
    "address": "Address",
    "openingHours": "Opening Hours",
    "phone": "Phone",
    "contactChannels": "Contact Channels",
    "openMap": "Open Map",
    "directions": "Directions"
  },
  "merchant": {
    "createdBy": "Powered by DealDoor",
    "createYourPage": "Create Your Shop Page",
    "freeToStart": "Free to start"
  }
}
```

### 3.5 `src/i18n/th/dashboard.json`

```json
{
  "dashboard": {
    "title": "แดชบอร์ด",
    "shopInfo": "ข้อมูลร้าน",
    "deals": "ดีล",
    "menu": "เมนู",
    "settings": "ตั้งค่า",
    "preview": "ดูตัวอย่าง",
    "shareLink": "ลิงก์หน้าร้าน"
  },
  "shopForm": {
    "shopName": "ชื่อร้าน",
    "category": "ประเภทร้าน",
    "description": "คำอธิบาย",
    "address": "ที่อยู่",
    "phone": "เบอร์โทร",
    "lineId": "LINE ID",
    "facebook": "Facebook",
    "instagram": "Instagram",
    "website": "Website",
    "save": "บันทึก"
  },
  "dealForm": {
    "title": "ชื่อดีล",
    "category": "หมวดหมู่",
    "description": "รายละเอียด",
    "shortDescription": "คำอธิบายสั้น",
    "discount": "ส่วนลด / ผลประโยชน์",
    "conditions": "เงื่อนไข",
    "couponCode": "โค้ด (ถ้ามี)",
    "claimType": "วิธีรับสิทธิ์",
    "endDate": "วันหมดอายุ",
    "save": "บันทึก"
  },
  "limit": {
    "dealLimitReached": "จำกัดดีลสูงสุด {max} ดีล",
    "upgradeMessage": "อัปเกรดเป็น Pro เพื่อเพิ่มดีลได้ไม่จำกัด",
    "upgradeButton": "อัปเกรดเป็น Pro",
    "or": "หรือ",
    "deactivateOld": "ปิดใช้งานดีลเก่าก่อน"
  }
}
```

### 3.6 `src/i18n/en/dashboard.json`

```json
{
  "dashboard": {
    "title": "Dashboard",
    "shopInfo": "Shop Info",
    "deals": "Deals",
    "menu": "Menu",
    "settings": "Settings",
    "preview": "Preview",
    "shareLink": "Share Link"
  },
  "shopForm": {
    "shopName": "Shop Name",
    "category": "Category",
    "description": "Description",
    "address": "Address",
    "phone": "Phone",
    "lineId": "LINE ID",
    "facebook": "Facebook",
    "instagram": "Instagram",
    "website": "Website",
    "save": "Save"
  },
  "dealForm": {
    "title": "Deal Title",
    "category": "Category",
    "description": "Description",
    "shortDescription": "Short Description",
    "discount": "Discount / Benefit",
    "conditions": "Conditions",
    "couponCode": "Coupon Code (optional)",
    "claimType": "Claim Type",
    "endDate": "Expiration Date",
    "save": "Save"
  },
  "limit": {
    "dealLimitReached": "Maximum {max} deals limit reached",
    "upgradeMessage": "Upgrade to Pro for unlimited deals",
    "upgradeButton": "Upgrade to Pro",
    "or": "or",
    "deactivateOld": "Deactivate old deals first"
  }
}
```

### 3.7 `src/i18n/th/explore.json`

```json
{
  "explore": {
    "title": "ดีลใกล้ตัว",
    "search": "ค้นหาดีล ร้านค้า...",
    "all": "ทั้งหมด",
    "expiringSoon": "ดีลใกล้หมดอายุ",
    "popular": "ดีลยอดนิยม",
    "newest": "ดีลใหม่ล่าสุด",
    "nearby": "ใกล้คุณ",
    "sort": "เรียงตาม",
    "filter": "กรอง",
    "map": "แผนที่",
    "list": "รายการ"
  }
}
```

### 3.8 `src/i18n/en/explore.json`

```json
{
  "explore": {
    "title": "Explore Deals",
    "search": "Search deals, shops...",
    "all": "All",
    "expiringSoon": "Expiring Soon",
    "popular": "Popular",
    "newest": "Newest",
    "nearby": "Nearby",
    "sort": "Sort by",
    "filter": "Filter",
    "map": "Map",
    "list": "List"
  }
}
```

---

## 4. i18n Helper

### File: `src/i18n/index.ts`

```typescript
import thCommon from './th/common.json';
import thShop from './th/shop.json';
import thDeal from './th/deal.json';
import thDashboard from './th/dashboard.json';
import thExplore from './th/explore.json';

import enCommon from './en/common.json';
import enShop from './en/shop.json';
import enDeal from './en/deal.json';
import enDashboard from './en/dashboard.json';
import enExplore from './en/explore.json';

export const LANGUAGES = {
  th: { name: 'ไทย', flag: '🇹🇭' },
  en: { name: 'English', flag: '🇺🇸' },
} as const;

export type Language = keyof typeof LANGUAGES;
export type Namespace = 'common' | 'shop' | 'deal' | 'dashboard' | 'explore';

const translations = {
  th: {
    common: thCommon,
    shop: thShop,
    deal: thDeal,
    dashboard: thDashboard,
    explore: thExplore,
  },
  en: {
    common: enCommon,
    shop: enShop,
    deal: enDeal,
    dashboard: enDashboard,
    explore: enExplore,
  },
} as const;

export function getLangFromUrl(url: URL): Language {
  const path = url.pathname;
  if (path.startsWith('/en')) return 'en';
  return 'th';
}

export function t(
  lang: Language,
  namespace: Namespace,
  key: string,
  params?: Record<string, string | number>
): string {
  const keys = key.split('.');
  let value: any = translations[lang][namespace];

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      // Fallback to Thai
      value = translations['th'][namespace];
      for (const fk of keys) {
        value = value?.[fk];
      }
      break;
    }
  }

  if (typeof value !== 'string') return key;

  // Replace params
  if (params) {
    return Object.entries(params).reduce(
      (str, [key, val]) => str.replace(`{${key}}`, String(val)),
      value
    );
  }

  return value;
}

export function getLocalizedPath(path: string, lang: Language): string {
  // Remove existing language prefix
  const cleanPath = path.replace(/^\/(th|en)/, '') || '/';

  if (lang === 'th') {
    return cleanPath; // Thai is default, no prefix
  }

  return `/${lang}${cleanPath}`;
}
```

---

## 5. Usage in Components

### 5.1 Astro Components

```astro
---
import { getLangFromUrl, t } from '../i18n';

const lang = getLangFromUrl(Astro.url);
const common = (key: string, params?: Record<string, string | number>) => 
  t(lang, 'common', key, params);
---

<header>
  <a href="/">{common('brand.name')}</a>
  <nav>
    <a href="/explore">{common('nav.explore')}</a>
    <a href="/dashboard">{common('nav.createShop')}</a>
  </nav>
</header>
```

### 5.2 React Components

```tsx
import { t, type Language } from '../i18n';

interface Props {
  lang: Language;
}

export default function DealCard({ lang }: Props) {
  const common = (key: string) => t(lang, 'common', key);
  const deal = (key: string) => t(lang, 'deal', key);

  return (
    <div>
      <span>{deal('dealCard.activeDeals')}</span>
      <button>{common('action.share')}</button>
    </div>
  );
}
```

---

## 6. Astro i18n Routing

### 6.1 `astro.config.ts`

```typescript
import { defineConfig } from 'astro/config';

export default defineConfig({
  i18n: {
    defaultLocale: 'th',
    locales: ['th', 'en'],
    routing: {
      prefixDefaultLocale: false, // No /th/ prefix
    },
  },
});
```

### 6.2 Page Structure

```
src/pages/
├── index.astro              → / (Thai)
├── en/
│   └── index.astro          → /en (English)
├── explore/
│   ├── index.astro          → /explore (Thai)
│   └── en/
│       └── index.astro      → /en/explore (English)
├── [slug].astro             → /[slug] (Thai)
└── en/
    └── [slug].astro         → /en/[slug] (English)
```

**Or use middleware for dynamic translation:**

```
src/pages/
├── index.astro              → / or /en
├── explore/
│   └── index.astro          → /explore or /en/explore
├── [slug].astro             → /[slug] or /en/[slug]
└── dashboard/
    └── index.astro          → /dashboard or /en/dashboard
```

### 6.3 Middleware

```typescript
// src/middleware.ts

import { defineMiddleware } from 'astro:middleware';
import { getLangFromUrl } from './i18n';

export const onRequest = defineMiddleware((context, next) => {
  const lang = getLangFromUrl(context.url);
  context.locals.lang = lang;
  return next();
});
```

---

## 7. Language Switcher Component

```astro
---
import { LANGUAGES, getLangFromUrl, getLocalizedPath } from '../i18n';

const currentLang = getLangFromUrl(Astro.url);
const currentPath = Astro.url.pathname;
---

<div class="relative" id="lang-switcher">
  <button class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm hover:bg-gray-100">
    <span>{LANGUAGES[currentLang].flag}</span>
    <span>{LANGUAGES[currentLang].name}</span>
    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
    </svg>
  </button>
  
  <div class="absolute right-0 top-full z-50 mt-1 hidden w-32 rounded-lg border bg-white shadow-lg" id="lang-dropdown">
    {Object.entries(LANGUAGES).map(([code, { name, flag }]) => (
      <a
        href={getLocalizedPath(currentPath, code as keyof typeof LANGUAGES)}
        class:list={[
          'flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50',
          code === currentLang && 'bg-primary-light text-primary',
        ]}
      >
        <span>{flag}</span>
        <span>{name}</span>
      </a>
    ))}
  </div>
</div>

<script>
  const btn = document.querySelector('#lang-switcher button');
  const dropdown = document.querySelector('#lang-dropdown');
  
  btn?.addEventListener('click', () => {
    dropdown?.classList.toggle('hidden');
  });
  
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#lang-switcher')) {
      dropdown?.classList.add('hidden');
    }
  });
</script>
```

---

## 8. Database Fields for Multi-language

### Option A: Single Language (MVP)

Merchant content (shop name, deal title, description) is stored in one language only. Merchant selects their primary language during setup.

```typescript
// In shop table
language: text('language').default('th'), // Primary language
```

### Option B: Multi-language Fields (Future)

```typescript
// JSON fields for translatable content
name: text('name').notNull(), // Primary language
nameTranslations: text('name_translations'), // JSON: {"en": "Moon Bowl Cafe"}
```

### Recommendation

**MVP:** Single language per shop. Merchant creates content in their language. UI chrome (buttons, labels) is translated based on viewer's language preference.

**Future:** Allow merchants to add translations for their content.

---

## 9. SEO & Meta Tags

```astro
---
const lang = getLangFromUrl(Astro.url);
---

<html lang={lang}>
<head>
  <meta charset="UTF-8" />
  
  {/* Alternate language links */}
  <link rel="alternate" hreflang="th" href={getLocalizedPath(Astro.url.pathname, 'th')} />
  <link rel="alternate" hreflang="en" href={getLocalizedPath(Astro.url.pathname, 'en')} />
  <link rel="alternate" hreflang="x-default" href={getLocalizedPath(Astro.url.pathname, 'th')} />
</head>
```

---

## 10. Date & Number Formatting

```typescript
// src/lib/formatters.ts

import type { Language } from '../i18n';

export function formatDate(date: Date, lang: Language): string {
  if (lang === 'th') {
    // Thai date format: 31 กรกฎาคม 2568
    return date.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }
  
  // English date format: July 31, 2025
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatPrice(price: number, lang: Language): string {
  if (lang === 'th') {
    return `฿${price.toLocaleString('th-TH')}`;
  }
  return `฿${price.toLocaleString('en-US')}`;
}

export function formatNumber(num: number, lang: Language): string {
  return num.toLocaleString(lang === 'th' ? 'th-TH' : 'en-US');
}
```
