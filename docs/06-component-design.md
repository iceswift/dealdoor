# DealDoor — Component Design

---

## 1. Component Categories

| Category | Location | Framework | Hydration |
|----------|----------|-----------|-----------|
| Shop | `components/shop/` | Astro + React | As needed |
| Explore | `components/explore/` | Astro + React | As needed |
| Dashboard | `components/dashboard/` | React | On load |
| Shared | `components/shared/` | Astro | None |

---

## 2. Shared Components

### 2.1 Header

**File:** `components/shared/Header.astro`

```astro
---
interface Props {
  transparent?: boolean;
}

const { transparent = false } = Astro.props;
---

<header class:list={['sticky top-0 z-50 border-b', transparent ? 'bg-white/80 backdrop-blur' : 'bg-white']}>
  <nav class="mx-auto flex max-w-shop items-center justify-between px-4 py-3">
    <a href="/" class="flex items-center gap-2">
      <img src="/favicon.svg" alt="DealDoor" class="h-8 w-8" />
      <span class="text-lg font-bold text-secondary">DealDoor</span>
    </a>
    <div class="flex items-center gap-3">
      <a href="/explore" class="text-sm text-gray-600 hover:text-primary">ดีลใกล้ตัว</a>
      <a href="/dashboard" class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark">
        สร้างหน้าร้าน
      </a>
    </div>
  </nav>
</header>
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `transparent` | boolean | false | Transparent background with blur |

---

### 2.2 Footer

**File:** `components/shared/Footer.astro`

```astro
---
---

<footer class="border-t bg-gray-50 py-8">
  <div class="mx-auto max-w-shop px-4 text-center">
    <p class="text-sm text-gray-500">
      สร้างโดย <a href="/" class="font-medium text-primary hover:underline">DealDoor</a>
    </p>
    <p class="mt-2 text-xs text-gray-400">
      หน้าโปรโมชันร้านค้า แชร์ง่าย หมดอายุเอง
    </p>
  </div>
</footer>
```

---

### 2.3 CountdownBadge

**File:** `components/shared/CountdownBadge.astro`

```astro
---
interface Props {
  endDate: Date;
}

const { endDate } = Astro.props;

const now = new Date();
const end = new Date(endDate);
const diff = end.getTime() - now.getTime();
const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
const hoursLeft = Math.ceil(diff / (1000 * 60 * 60));

let badgeClass = '';
let text = '';

if (daysLeft <= 0) {
  badgeClass = 'bg-gray-100 text-gray-500';
  text = 'หมดอายุแล้ว';
} else if (hoursLeft <= 24) {
  badgeClass = 'bg-red-100 text-red-700 animate-pulse';
  text = 'หมดอายุวันนี้';
} else if (daysLeft <= 3) {
  badgeClass = 'bg-orange-100 text-orange-700';
  text = `เหลือ ${daysLeft} วัน`;
} else if (daysLeft <= 7) {
  badgeClass = 'bg-yellow-100 text-yellow-700';
  text = `เหลือ ${daysLeft} วัน`;
} else {
  badgeClass = 'bg-gray-100 text-gray-600';
  text = `เหลือ ${daysLeft} วัน`;
}
---

<span class:list={['inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', badgeClass]}>
  <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
  {text}
</span>
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `endDate` | Date | required | Deal expiration date |

**States:**
- More than 7 days: Gray
- 3-7 days: Yellow
- Less than 3 days: Orange
- Less than 24 hours: Red with pulse animation
- Expired: Gray "หมดอายุแล้ว"

---

### 2.4 CategoryBadge

**File:** `components/shared/CategoryBadge.astro`

```astro
---
import { DEAL_CATEGORY_LABELS, DEAL_CATEGORY_COLORS } from '../../lib/constants';

interface Props {
  category: string;
}

const { category } = Astro.props;
const label = DEAL_CATEGORY_LABELS[category] || category;
const color = DEAL_CATEGORY_COLORS[category] || '#6B7280';
---

<span
  class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
  style={`background-color: ${color}20; color: ${color}`}
>
  {label}
</span>
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `category` | string | required | Deal category key |

---

### 2.5 Toast

**File:** `components/shared/Toast.tsx`

```tsx
import { useState, useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
}

export default function Toast({ message, type = 'success', duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  }[type];

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transform transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
      }`}
    >
      <div className={`${bgColor} rounded-lg px-4 py-2 text-white shadow-lg`}>
        {message}
      </div>
    </div>
  );
}
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `message` | string | required | Toast message |
| `type` | 'success' \| 'error' \| 'info' | 'success' | Toast type |
| `duration` | number | 3000 | Duration in ms |
| `onClose` | function | required | Close callback |

---

### 2.6 Skeleton

**File:** `components/shared/Skeleton.astro`

```astro
---
interface Props {
  width?: string;
  height?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
}

const { width = 'w-full', height = 'h-4', rounded = 'md' } = Astro.props;
---

<div class:list={['animate-pulse bg-gray-200', width, height, `rounded-${rounded}`]} />
```

---

## 3. Shop Components

### 3.1 ShopHeader

**File:** `components/shop/ShopHeader.astro`

```astro
---
import type { Shop } from '../../lib/types';
import { SHOP_CATEGORY_LABELS } from '../../lib/constants';
import ContactButtons from './ContactButtons.tsx';

interface Props {
  shop: Shop;
}

const { shop } = Astro.props;
const categoryLabel = SHOP_CATEGORY_LABELS[shop.category] || shop.category;
---

<div class="relative">
  <!-- Cover Image -->
  <div class="h-48 overflow-hidden bg-gradient-to-br from-primary-light to-orange-100">
    {shop.coverImage ? (
      <img src={shop.coverImage} alt={shop.name} class="h-full w-full object-cover" />
    ) : (
      <div class="flex h-full items-center justify-center">
        <span class="text-4xl">🏪</span>
      </div>
    )}
  </div>

  <!-- Logo -->
  <div class="relative -mt-12 px-4">
    <div class="flex items-end gap-3">
      <div class="h-20 w-20 overflow-hidden rounded-xl border-4 border-white bg-white shadow-md">
        {shop.logoImage ? (
          <img src={shop.logoImage} alt={shop.name} class="h-full w-full object-cover" />
        ) : (
          <div class="flex h-full items-center justify-center bg-primary-light text-2xl">
            {shop.name.charAt(0)}
          </div>
        )}
      </div>
      <div class="mb-1">
        {shop.isOpen !== undefined && (
          <span class:list={[
            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
            shop.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          ]}>
            <span class:list={['h-1.5 w-1.5 rounded-full', shop.isOpen ? 'bg-green-500' : 'bg-red-500']} />
            {shop.isOpen ? 'เปิดอยู่' : 'ปิดแล้ว'}
          </span>
        )}
      </div>
    </div>
  </div>

  <!-- Shop Info -->
  <div class="mt-3 px-4">
    <h1 class="text-xl font-bold text-secondary">{shop.name}</h1>
    <p class="mt-1 text-sm text-gray-500">
      {categoryLabel} {shop.address && `· ${shop.address.split(' ').slice(-2).join(' ')}`}
    </p>
    {shop.description && (
      <p class="mt-2 text-sm text-gray-600">{shop.description}</p>
    )}
  </div>

  <!-- Contact Buttons -->
  <div class="mt-4 px-4">
    <ContactButtons client:visible shop={shop} />
  </div>
</div>
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `shop` | Shop | required | Shop data object |

---

### 3.2 DealCard

**File:** `components/shop/DealCard.astro`

```astro
---
import type { Deal } from '../../lib/types';
import { DEAL_CATEGORY_LABELS, DEAL_CATEGORY_COLORS, CLAIM_TYPE_LABELS } from '../../lib/constants';
import CountdownBadge from '../shared/CountdownBadge.astro';
import CategoryBadge from '../shared/CategoryBadge.astro';

interface Props {
  deal: Deal;
  showFull?: boolean;
}

const { deal, showFull = false } = Astro.props;

const now = new Date();
const endDate = new Date(deal.endDate);
const isExpired = !deal.isActive || endDate < now;
const categoryLabel = DEAL_CATEGORY_LABELS[deal.category] || deal.category;
const categoryColor = DEAL_CATEGORY_COLORS[deal.category] || '#6B7280';
---

<article
  class:list={[
    'relative overflow-hidden rounded-xl border bg-white transition-all hover:shadow-md',
    isExpired && 'opacity-60',
  ]}
  data-deal-id={deal.id}
>
  <!-- Category Badge & Countdown -->
  <div class="flex items-center justify-between border-b px-4 py-2">
    <CategoryBadge category={deal.category} />
    <CountdownBadge endDate={deal.endDate} />
  </div>

  <!-- Deal Content -->
  <div class="p-4">
    <h3 class="font-semibold text-secondary">{deal.title}</h3>
    
    {deal.shortDescription && (
      <p class="mt-1 text-sm text-gray-600">{deal.shortDescription}</p>
    )}

    {deal.discountText && (
      <div class="mt-2 inline-flex items-center rounded-lg bg-primary-light px-3 py-1.5">
        <span class="text-sm font-bold text-primary">{deal.discountText}</span>
      </div>
    )}

    {isExpired && (
      <div class="absolute inset-0 flex items-center justify-center bg-white/80">
        <span class="rounded-full bg-gray-200 px-4 py-2 text-sm font-medium text-gray-600">
          หมดอายุแล้ว
        </span>
      </div>
    )}
  </div>

  <!-- Actions -->
  {!isExpired && (
    <div class="flex items-center gap-2 border-t px-4 py-3">
      {deal.claimType === 'copy_code' && deal.couponCode && (
        <button
          class="copy-code-btn flex-1 rounded-lg bg-primary px-4 py-2 text-center text-sm font-medium text-white hover:bg-primary-dark transition-colors"
          data-code={deal.couponCode}
        >
          {CLAIM_TYPE_LABELS[deal.claimType]}
        </button>
      )}
      {deal.claimType === 'show_at_shop' && (
        <button class="flex-1 rounded-lg bg-gray-100 px-4 py-2 text-center text-sm font-medium text-gray-700">
          {CLAIM_TYPE_LABELS[deal.claimType]}
        </button>
      )}
      {deal.claimType === 'contact_shop' && (
        <button class="flex-1 rounded-lg bg-blue-100 px-4 py-2 text-center text-sm font-medium text-blue-700">
          {CLAIM_TYPE_LABELS[deal.claimType]}
        </button>
      )}
      {deal.claimType === 'open_line' && (
        <button class="flex-1 rounded-lg bg-green-500 px-4 py-2 text-center text-sm font-medium text-white">
          {CLAIM_TYPE_LABELS[deal.claimType]}
        </button>
      )}
      <button class="share-deal-btn rounded-lg border px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
        แชร์
      </button>
    </div>
  )}
</article>
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `deal` | Deal | required | Deal data object |
| `showFull` | boolean | false | Show full description |

---

### 3.3 DealDetailModal

**File:** `components/shop/DealDetailModal.tsx`

```tsx
import { useState, useEffect } from 'react';
import type { Deal } from '../../lib/types';
import { DEAL_CATEGORY_LABELS, CLAIM_TYPE_LABELS } from '../../lib/constants';

interface DealDetailModalProps {
  deal: Deal | null;
  shopName: string;
  onClose: () => void;
}

export default function DealDetailModal({ deal, shopName, onClose }: DealDetailModalProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (deal) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [deal]);

  if (!deal) return null;

  const endDate = new Date(deal.endDate);
  const now = new Date();
  const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const handleCopyCode = () => {
    if (deal.couponCode) {
      navigator.clipboard.writeText(deal.couponCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}${window.location.pathname}?deal=${deal.id}`;
    if (navigator.share) {
      navigator.share({
        title: `${deal.title} — ${shopName}`,
        text: deal.shortDescription || deal.title,
        url: url,
      });
    } else {
      navigator.clipboard.writeText(url);
      alert('คัดลอกลิงก์แล้ว!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b bg-white px-4 py-3">
          <h2 className="text-lg font-semibold text-secondary">รายละเอียดดีล</h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100">
            <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <span className="inline-flex items-center rounded-full bg-primary-light px-2.5 py-0.5 text-xs font-medium text-primary">
            {DEAL_CATEGORY_LABELS[deal.category] || deal.category}
          </span>

          <h3 className="mt-3 text-xl font-bold text-secondary">{deal.title}</h3>

          {deal.description && (
            <p className="mt-2 text-sm text-gray-600">{deal.description}</p>
          )}

          {deal.discountText && (
            <div className="mt-4 rounded-lg bg-primary-light p-3">
              <span className="text-lg font-bold text-primary">{deal.discountText}</span>
            </div>
          )}

          {/* Expiration */}
          <div className="mt-4 flex items-center gap-2">
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-gray-600">
              หมดอายุ: {endDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>

          {daysLeft <= 7 && daysLeft > 0 && (
            <p className="mt-1 text-sm font-medium text-orange-600">
              เหลืออีก {daysLeft} วัน
            </p>
          )}

          {/* Conditions */}
          {deal.conditions && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-secondary">เงื่อนไข</h4>
              <div className="mt-1 whitespace-pre-line text-sm text-gray-600">
                {deal.conditions}
              </div>
            </div>
          )}

          {/* Coupon Code */}
          {deal.couponCode && deal.claimType === 'copy_code' && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-secondary">โค้ด</h4>
              <div className="mt-1 flex items-center gap-2">
                <code className="flex-1 rounded-lg bg-gray-100 px-3 py-2 font-mono text-sm">
                  {deal.couponCode}
                </code>
                <button
                  onClick={handleCopyCode}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors"
                >
                  {copied ? '✓ คัดลอกแล้ว' : 'คัดลอก'}
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex flex-col gap-2">
            <button
              onClick={handleShare}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              แชร์ดีลนี้
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

### 3.4 ContactButtons

**File:** `components/shop/ContactButtons.tsx`

```tsx
import type { Shop } from '../../lib/types';

interface ContactButtonsProps {
  shop: Shop;
}

export default function ContactButtons({ shop }: ContactButtonsProps) {
  const buttons = [];

  if (shop.latitude && shop.longitude) {
    buttons.push({
      label: 'แผนที่',
      icon: '📍',
      href: `https://www.google.com/maps?q=${shop.latitude},${shop.longitude}`,
      color: 'bg-blue-50 text-blue-700 hover:bg-blue-100',
    });
  }

  if (shop.lineId) {
    const lineUrl = shop.lineId.startsWith('@')
      ? `https://line.me/ti/p/${shop.lineId}`
      : shop.lineId;
    buttons.push({
      label: 'LINE',
      icon: '💬',
      href: lineUrl,
      color: 'bg-green-50 text-green-700 hover:bg-green-100',
    });
  }

  if (shop.phone) {
    buttons.push({
      label: 'โทร',
      icon: '📞',
      href: `tel:${shop.phone}`,
      color: 'bg-gray-50 text-gray-700 hover:bg-gray-100',
    });
  }

  if (shop.facebookUrl) {
    buttons.push({
      label: 'Facebook',
      icon: '📘',
      href: shop.facebookUrl,
      color: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
    });
  }

  if (shop.instagramUrl) {
    buttons.push({
      label: 'Instagram',
      icon: '📷',
      href: shop.instagramUrl,
      color: 'bg-pink-50 text-pink-600 hover:bg-pink-100',
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {buttons.map((btn) => (
        <a
          key={btn.label}
          href={btn.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${btn.color}`}
        >
          <span>{btn.icon}</span>
          <span>{btn.label}</span>
        </a>
      ))}
    </div>
  );
}
```

---

### 3.5 MenuList

**File:** `components/shop/MenuList.astro`

```astro
---
import type { MenuItem } from '../../lib/types';

interface Props {
  items: MenuItem[];
}

const { items } = Astro.props;
---

{items.length > 0 && (
  <section class="mt-6">
    <h2 class="mb-3 text-lg font-semibold text-secondary">📋 เมนู / แคตตาล็อก</h2>
    <div class="space-y-3">
      {items.map((item) => (
        <div class="flex items-center gap-3 rounded-lg border p-3">
          <div class="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.name} class="h-full w-full object-cover" />
            ) : (
              <div class="flex h-full items-center justify-center text-2xl">🍽️</div>
            )}
          </div>
          <div class="flex-1">
            <h3 class="font-medium text-secondary">{item.name}</h3>
            {item.description && (
              <p class="mt-0.5 text-xs text-gray-500">{item.description}</p>
            )}
          </div>
          {item.price && (
            <span class="text-sm font-bold text-primary">฿{item.price}</span>
          )}
        </div>
      ))}
    </div>
  </section>
)}
```

---

### 3.6 ShopInfo

**File:** `components/shop/ShopInfo.astro`

```astro
---
import type { Shop } from '../../lib/types';
import MapPreview from './MapPreview.astro';

interface Props {
  shop: Shop;
}

const { shop } = Astro.props;

let hours: Record<string, string> = {};
try {
  hours = shop.openingHours ? JSON.parse(shop.openingHours) : {};
} catch (e) {}
---

<section class="mt-6">
  <h2 class="mb-3 text-lg font-semibold text-secondary">📍 ข้อมูลร้าน</h2>
  
  <div class="space-y-3">
    {shop.address && (
      <div class="flex items-start gap-2">
        <span class="mt-0.5 text-gray-400">📍</span>
        <p class="text-sm text-gray-600">{shop.address}</p>
      </div>
    )}

    {Object.keys(hours).length > 0 && (
      <div class="flex items-start gap-2">
        <span class="mt-0.5 text-gray-400">⏰</span>
        <div class="text-sm text-gray-600">
          {Object.entries(hours).map(([day, time]) => (
            <div class="flex gap-2">
              <span class="w-12 font-medium">{day.toUpperCase()}</span>
              <span>{time}</span>
            </div>
          ))}
        </div>
      </div>
    )}

    {shop.phone && (
      <div class="flex items-center gap-2">
        <span class="text-gray-400">📞</span>
        <a href={`tel:${shop.phone}`} class="text-sm text-primary hover:underline">{shop.phone}</a>
      </div>
    )}
  </div>

  {/* Map Preview */}
  {shop.latitude && shop.longitude && (
    <div class="mt-4">
      <MapPreview lat={shop.latitude} lng={shop.longitude} name={shop.name} />
    </div>
  )}

  {/* Social Links */}
  <div class="mt-4 flex flex-wrap gap-2">
    {shop.lineId && (
      <a href={shop.lineId.startsWith('@') ? `https://line.me/ti/p/${shop.lineId}` : shop.lineId}
         target="_blank" rel="noopener noreferrer"
         class="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-200">
        LINE
      </a>
    )}
    {shop.facebookUrl && (
      <a href={shop.facebookUrl} target="_blank" rel="noopener noreferrer"
         class="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200">
        Facebook
      </a>
    )}
    {shop.instagramUrl && (
      <a href={shop.instagramUrl} target="_blank" rel="noopener noreferrer"
         class="rounded-full bg-pink-100 px-3 py-1 text-xs font-medium text-pink-700 hover:bg-pink-200">
        Instagram
      </a>
    )}
    {shop.websiteUrl && (
      <a href={shop.websiteUrl} target="_blank" rel="noopener noreferrer"
         class="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200">
        Website
      </a>
    )}
  </div>
</section>
```

---

### 3.7 MapPreview

**File:** `components/shop/MapPreview.astro`

```astro
---
interface Props {
  lat: number;
  lng: number;
  name: string;
}

const { lat, lng, name } = Astro.props;
const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=400x200&markers=${lat},${lng}&key=YOUR_API_KEY`;
const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
---

<div class="overflow-hidden rounded-lg border">
  {/* Static map placeholder - use real map in production */}
  <div class="flex h-40 items-center justify-center bg-gray-100">
    <div class="text-center">
      <span class="text-3xl">🗺️</span>
      <p class="mt-1 text-sm text-gray-500">{name}</p>
      <a
        href={directionsUrl}
        target="_blank"
        rel="noopener noreferrer"
        class="mt-2 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
      >
        เปิดแผนที่
      </a>
    </div>
  </div>
</div>
```

---

## 4. Explore Components

### 4.1 CategoryChips

**File:** `components/explore/CategoryChips.astro`

```astro
---
import { SHOP_CATEGORIES, SHOP_CATEGORY_LABELS } from '../../lib/constants';

interface Props {
  active?: string;
}

const { active = 'all' } = Astro.props;
---

<div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
  <a
    href="/explore"
    class:list={[
      'flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors',
      active === 'all' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    ]}
  >
    ทั้งหมด
  </a>
  {SHOP_CATEGORIES.map((cat) => (
    <a
      href={`/explore/${cat}`}
      class:list={[
        'flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors',
        active === cat ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
      ]}
    >
      {SHOP_CATEGORY_LABELS[cat]}
    </a>
  ))}
</div>
```

---

### 4.2 SearchBar

**File:** `components/explore/SearchBar.tsx`

```tsx
import { useState } from 'react';

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
}

export default function SearchBar({ placeholder = 'ค้นหาดีล ร้านค้า...', onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm focus:border-primary focus:bg-white focus:outline-none"
      />
      <svg
        className="absolute left-3 top-3.5 h-4 w-4 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    </form>
  );
}
```

---

## 5. Dashboard Components

### 5.1 DealList

**File:** `components/dashboard/DealList.tsx`

```tsx
import { useState } from 'react';
import type { Deal } from '../../lib/types';
import { DEAL_CATEGORY_LABELS } from '../../lib/constants';
import CountdownBadge from '../shared/CountdownBadge';

interface DealListProps {
  deals: Deal[];
  maxDeals: number;
  onEdit: (deal: Deal) => void;
  onDelete: (dealId: string) => void;
  onToggleActive: (dealId: string, isActive: boolean) => void;
}

export default function DealList({ deals, maxDeals, onEdit, onDelete, onToggleActive }: DealListProps) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-secondary">
          จัดการดีล ({deals.length}/{maxDeals})
        </h2>
      </div>

      <div className="mt-3 space-y-3">
        {deals.map((deal) => {
          const endDate = new Date(deal.endDate);
          const isExpired = endDate < new Date() || !deal.isActive;

          return (
            <div
              key={deal.id}
              className={`flex items-center gap-3 rounded-lg border p-3 ${isExpired ? 'opacity-60' : ''}`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-secondary">{deal.title}</span>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                    {DEAL_CATEGORY_LABELS[deal.category]}
                  </span>
                </div>
                <div className="mt-1">
                  <CountdownBadge endDate={deal.endDate} />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onToggleActive(deal.id, !deal.isActive)}
                  className={`rounded-lg px-2 py-1 text-xs font-medium ${
                    deal.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {deal.isActive ? 'Active' : 'Inactive'}
                </button>
                <button
                  onClick={() => onEdit(deal)}
                  className="rounded-lg bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200"
                >
                  แก้ไข
                </button>
                <button
                  onClick={() => onDelete(deal.id)}
                  className="rounded-lg bg-red-100 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-200"
                >
                  ลบ
                </button>
              </div>
            </div>
          );
        })}

        {deals.length === 0 && (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <span className="text-3xl">📋</span>
            <p className="mt-2 text-sm text-gray-500">ยังไม่มีดีล</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

### 5.2 ShareLink

**File:** `components/dashboard/ShareLink.tsx`

```tsx
import { useState } from 'react';

interface ShareLinkProps {
  slug: string;
}

export default function ShareLink({ slug }: ShareLinkProps) {
  const [copied, setCopied] = useState(false);
  const url = `https://dealdoor.co/${slug}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border bg-gray-50 p-4">
      <h3 className="text-sm font-medium text-secondary">🔗 ลิงก์หน้าร้าน</h3>
      <div className="mt-2 flex items-center gap-2">
        <input
          type="text"
          value={url}
          readOnly
          className="flex-1 rounded-lg border bg-white px-3 py-2 text-sm text-gray-600"
        />
        <button
          onClick={handleCopy}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors"
        >
          {copied ? '✓ คัดลอกแล้ว' : 'คัดลอก'}
        </button>
      </div>
      <p className="mt-2 text-xs text-gray-500">
        แชร์ลิงก์นี้บน LINE, Facebook, Instagram หรือ QR Code
      </p>
    </div>
  );
}
```

---

## 6. Loading & Skeleton States

### 6.1 ShopHeader Skeleton

```astro
---
// components/shop/ShopHeaderSkeleton.astro
---

<div class="animate-pulse">
  {/* Cover skeleton */}
  <div class="h-48 bg-gray-200" />
  
  {/* Logo skeleton */}
  <div class="relative -mt-12 px-4">
    <div class="flex items-end gap-3">
      <div class="h-20 w-20 rounded-xl border-4 border-white bg-gray-300" />
      <div class="mb-1 h-6 w-20 rounded-full bg-gray-200" />
    </div>
  </div>
  
  {/* Text skeleton */}
  <div class="mt-3 space-y-2 px-4">
    <div class="h-6 w-48 rounded bg-gray-200" />
    <div class="h-4 w-32 rounded bg-gray-200" />
    <div class="h-4 w-64 rounded bg-gray-200" />
  </div>
  
  {/* Buttons skeleton */}
  <div class="mt-4 flex gap-2 px-4">
    <div class="h-10 w-24 rounded-lg bg-gray-200" />
    <div class="h-10 w-24 rounded-lg bg-gray-200" />
    <div class="h-10 w-24 rounded-lg bg-gray-200" />
  </div>
</div>
```

### 6.2 DealCard Skeleton

```astro
---
// components/shop/DealCardSkeleton.astro
---

<div class="animate-pulse rounded-xl border">
  {/* Header skeleton */}
  <div class="flex items-center justify-between border-b px-4 py-2">
    <div class="h-5 w-16 rounded-full bg-gray-200" />
    <div class="h-5 w-20 rounded-full bg-gray-200" />
  </div>
  
  {/* Content skeleton */}
  <div class="space-y-2 p-4">
    <div class="h-5 w-3/4 rounded bg-gray-200" />
    <div class="h-4 w-full rounded bg-gray-200" />
    <div class="h-8 w-32 rounded-lg bg-gray-200" />
  </div>
  
  {/* Actions skeleton */}
  <div class="flex gap-2 border-t px-4 py-3">
    <div class="h-10 flex-1 rounded-lg bg-gray-200" />
    <div class="h-10 w-16 rounded-lg bg-gray-200" />
  </div>
</div>
```

### 6.3 MenuList Skeleton

```astro
---
// components/shop/MenuListSkeleton.astro
---

<div class="animate-pulse space-y-3">
  <div class="h-6 w-40 rounded bg-gray-200" />
  
  {[1, 2, 3].map(() => (
    <div class="flex items-center gap-3 rounded-lg border p-3">
      <div class="h-16 w-16 rounded-lg bg-gray-200" />
      <div class="flex-1 space-y-2">
        <div class="h-4 w-24 rounded bg-gray-200" />
        <div class="h-3 w-32 rounded bg-gray-200" />
      </div>
      <div class="h-4 w-12 rounded bg-gray-200" />
    </div>
  ))}
</div>
```

### 6.4 ShopInfo Skeleton

```astro
---
// components/shop/ShopInfoSkeleton.astro
---

<div class="animate-pulse space-y-4">
  <div class="h-6 w-32 rounded bg-gray-200" />
  
  <div class="space-y-3">
    <div class="flex items-center gap-2">
      <div class="h-4 w-4 rounded bg-gray-200" />
      <div class="h-4 w-48 rounded bg-gray-200" />
    </div>
    <div class="flex items-center gap-2">
      <div class="h-4 w-4 rounded bg-gray-200" />
      <div class="h-4 w-32 rounded bg-gray-200" />
    </div>
    <div class="flex items-center gap-2">
      <div class="h-4 w-4 rounded bg-gray-200" />
      <div class="h-4 w-24 rounded bg-gray-200" />
    </div>
  </div>
  
  <div class="h-40 rounded-lg bg-gray-200" />
  
  <div class="flex gap-2">
    <div class="h-6 w-16 rounded-full bg-gray-200" />
    <div class="h-6 w-16 rounded-full bg-gray-200" />
  </div>
</div>
```

### 6.5 ExploreFeed Skeleton

```astro
---
// components/explore/ExploreFeedSkeleton.astro
---

<div class="animate-pulse space-y-4">
  {/* Category chips skeleton */}
  <div class="flex gap-2">
    {[1, 2, 3, 4, 5].map(() => (
      <div class="h-8 w-16 rounded-full bg-gray-200" />
    ))}
  </div>
  
  {/* Section title skeleton */}
  <div class="h-6 w-32 rounded bg-gray-200" />
  
  {/* Cards skeleton */}
  <div class="grid grid-cols-2 gap-4">
    {[1, 2, 3, 4].map(() => (
      <div class="rounded-xl border">
        <div class="h-24 bg-gray-200" />
        <div class="space-y-2 p-3">
          <div class="h-4 w-full rounded bg-gray-200" />
          <div class="h-3 w-3/4 rounded bg-gray-200" />
        </div>
      </div>
    ))}
  </div>
</div>
```

### 6.6 DealList Skeleton (Dashboard)

```tsx
// components/dashboard/DealListSkeleton.tsx

export default function DealListSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-6 w-32 rounded bg-gray-200" />
      
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-5 w-32 rounded bg-gray-200" />
              <div className="h-5 w-16 rounded-full bg-gray-200" />
            </div>
            <div className="h-4 w-20 rounded bg-gray-200" />
          </div>
          <div className="flex gap-2">
            <div className="h-7 w-16 rounded-lg bg-gray-200" />
            <div className="h-7 w-12 rounded-lg bg-gray-200" />
            <div className="h-7 w-12 rounded-lg bg-gray-200" />
          </div>
        </div>
      ))}
    </div>
  );
}
```

### 6.7 Full Page Skeleton

```astro
---
// components/shared/PageSkeleton.astro

interface Props {
  type: 'shop' | 'explore' | 'dashboard';
}

const { type } = Astro.props;
---

<div class="animate-pulse">
  {/* Header skeleton */}
  <div class="sticky top-0 z-50 border-b bg-white">
    <div class="mx-auto flex max-w-shop items-center justify-between px-4 py-3">
      <div class="h-8 w-24 rounded bg-gray-200" />
      <div class="flex gap-3">
        <div class="h-8 w-16 rounded bg-gray-200" />
        <div class="h-8 w-24 rounded-lg bg-gray-200" />
      </div>
    </div>
  </div>

  {/* Content skeleton */}
  <div class="mx-auto max-w-shop px-4 py-6">
    {type === 'shop' && (
      <div class="space-y-6">
        <div class="h-48 rounded-xl bg-gray-200" />
        <div class="space-y-2">
          <div class="h-6 w-48 rounded bg-gray-200" />
          <div class="h-4 w-32 rounded bg-gray-200" />
        </div>
        <div class="space-y-4">
          <div class="h-32 rounded-xl bg-gray-200" />
          <div class="h-32 rounded-xl bg-gray-200" />
        </div>
      </div>
    )}

    {type === 'explore' && (
      <div class="space-y-4">
        <div class="h-10 w-full rounded-xl bg-gray-200" />
        <div class="flex gap-2">
          {[1, 2, 3, 4].map(() => (
            <div class="h-8 w-16 rounded-full bg-gray-200" />
          ))}
        </div>
        <div class="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(() => (
            <div class="h-48 rounded-xl bg-gray-200" />
          ))}
        </div>
      </div>
    )}

    {type === 'dashboard' && (
      <div class="space-y-6">
        <div class="h-10 w-full rounded bg-gray-200" />
        <div class="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(() => (
            <div class="h-24 rounded-xl bg-gray-200" />
          ))}
        </div>
        <div class="h-64 rounded-xl bg-gray-200" />
      </div>
    )}
  </div>
</div>
```

### 6.8 Usage Pattern

```astro
---
// Example: Shop page with loading state

import ShopHeader from '../components/shop/ShopHeader.astro';
import ShopHeaderSkeleton from '../components/shop/ShopHeaderSkeleton.astro';
import DealCard from '../components/shop/DealCard.astro';
import DealCardSkeleton from '../components/shop/DealCardSkeleton.astro';

// Server-side data loading (no loading state needed for SSR)
const shop = await getShopBySlug(slug);
---

{/* For SSR: Render directly */}
<ShopHeader shop={shop} />

{/* For CSR (React islands): Use loading state */}
<ShopHeaderSkeleton /> {/* Show while loading */}
<ShopHeader shop={shop} /> {/* Replace when loaded */}
```

### 6.9 Client-Side Loading Pattern (React)

```tsx
// components/dashboard/ShopForm.tsx

import { useState, useEffect } from 'react';
import ShopFormSkeleton from './ShopFormSkeleton';

export default function ShopForm() {
  const [loading, setLoading] = useState(true);
  const [shop, setShop] = useState(null);

  useEffect(() => {
    fetchShop().then((data) => {
      setShop(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <ShopFormSkeleton />;
  }

  return (
    <form>
      {/* Form fields */}
    </form>
  );
}
```
