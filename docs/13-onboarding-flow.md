# DealDoor — Onboarding Flow Design

---

## 1. Overview

The onboarding flow guides merchants from landing page to first published deal in under 5 minutes.

---

## 2. Onboarding Principles

| Principle | Description |
|-----------|-------------|
| Fast | Complete in under 5 minutes |
| Simple | No technical knowledge required |
| Progressive | Show only what's needed now |
| Rewarding | Immediate value at each step |

---

## 3. Onboarding Steps

### Step Flow

```
Landing → Create Account → Shop Setup → First Deal → Preview → Share
   │           │               │             │          │        │
   │           │               │             │          │        └─ Copy link
   │           │               │             │          └─ See public page
   │           │               │             └─ Add first promotion
   │           │               └─ Name, category, contact
   │           └─ Email, password (or skip for MVP)
   └─ Click "Create Shop Page"
```

---

## 4. Step 1: Landing Page CTA

### Wireframe

```
┌─────────────────────────────────┐
│                                 │
│   สร้างหน้าโปรโมชันร้านของคุณ    │
│   แชร์ง่าย หมดอายุเอง           │
│                                 │
│   [🚀 เริ่มสร้างหน้าร้าน]       │ ← Primary CTA
│                                 │
│   ฟรี ไม่ต้องใช้บัตรเครดิต      │ ← Trust signal
│                                 │
│   ── หรือ ──                    │
│                                 │
│   [ดูตัวอย่างร้านค้า]           │ ← Secondary CTA
│                                 │
└─────────────────────────────────┘
```

---

## 5. Step 2: Quick Setup (No Auth for MVP)

### Wireframe — Quick Setup Form

```
┌─────────────────────────────────┐
│  ← Back          ขั้นตอน 1/3    │
├─────────────────────────────────┤
│                                 │
│   ตั้งค่าร้านของคุณ             │
│                                 │
│   ชื่อร้าน *                    │
│   ┌─────────────────────────────┐│
│   │ Moon Bowl Cafe              ││
│   └─────────────────────────────┘│
│                                 │
│   ประเภทร้าน *                  │
│   ┌─────────────────────────────┐│
│   │ เลือกประเภท          ▼     ││
│   └─────────────────────────────┘│
│   [คาเฟ่] [ร้านอาหาร] [ความงาม] │
│                                 │
│   เบอร์โทร                      │
│   ┌─────────────────────────────┐│
│   │ 081-234-5678                ││
│   └─────────────────────────────┘│
│                                 │
│   LINE ID                       │
│   ┌─────────────────────────────┐│
│   │ @moonbowlcafe               ││
│   └─────────────────────────────┘│
│                                 │
│   [ถัดไป →]                     │
│                                 │
└─────────────────────────────────┘
```

### Validation

| Field | Required | Validation |
|-------|----------|------------|
| Shop name | Yes | 2-50 characters |
| Category | Yes | From predefined list |
| Phone | No | Valid Thai phone format |
| LINE ID | No | Starts with @ |

---

## 6. Step 3: Add First Deal

### Wireframe — Deal Form

```
┌─────────────────────────────────┐
│  ← Back          ขั้นตอน 2/3    │
├─────────────────────────────────┤
│                                 │
│   เพิ่มโปรโมชันแรก              │
│                                 │
│   ชื่อดีล *                     │
│   ┌─────────────────────────────┐│
│   │ Birthday Free Brownie       ││
│   └─────────────────────────────┘│
│                                 │
│   หมวดหมู่ *                    │
│   [🎂 Birthday] [📅 รายเดือน]   │
│   [🎓 นักเรียน] [👴 ผู้สูงอายุ] │
│   [⚡ Flash] [✨ อื่นๆ]         │
│                                 │
│   ส่วนลด / ผลประโยชน์ *        │
│   ┌─────────────────────────────┐│
│   │ ฟรีบราวนี่ 1 ชิ้น           ││
│   └─────────────────────────────┘│
│                                 │
│   วันหมดอายุ *                  │
│   ┌─────────────────────────────┐│
│   │ 📅 31/07/2025               ││
│   └─────────────────────────────┘│
│                                 │
│   โค้ด (ถ้ามี)                  │
│   ┌─────────────────────────────┐│
│   │ MOONBDAY2025                ││
│   └─────────────────────────────┘│
│                                 │
│   [+ เพิ่มดีลอีก] [ถัดไป →]    │
│                                 │
└─────────────────────────────────┘
```

### Quick Add Templates

```
┌─────────────────────────────────┐
│   หรือเลือกเทมเพลต:            │
│                                 │
│   [🎂 Birthday Deal]            │
│   [📅 Monthly Special]          │
│   [🎓 Student Discount]         │
│   [⚡ Flash Sale]               │
│                                 │
└─────────────────────────────────┘
```

---

## 7. Step 4: Preview & Share

### Wireframe — Success Screen

```
┌─────────────────────────────────┐
│                                 │
│         🎉                      │
│   หน้าร้านของคุณพร้อมแล้ว!      │
│                                 │
│   ┌─────────────────────────────┐│
│   │                             ││
│   │   [Shop Page Preview]       ││
│   │                             ││
│   └─────────────────────────────┘│
│                                 │
│   ลิงก์หน้าร้าน:                │
│   ┌─────────────────────────────┐│
│   │ dealdoor.co/moon-bowl-cafe  ││
│   │           [📋 คัดลอก]       ││
│   └─────────────────────────────┘│
│                                 │
│   แชร์ไปที่:                    │
│   [LINE] [Facebook] [Instagram] │
│                                 │
│   [ดูแดชบอร์ด →]               │
│                                 │
└─────────────────────────────────┘
```

---

## 8. Progress Indicator

### Wireframe

```
┌─────────────────────────────────┐
│  ●───●───○  ขั้นตอน 2/3         │
│  1   2   3                       │
└─────────────────────────────────┘
```

### Implementation

```astro
---
interface Props {
  currentStep: number;
  totalSteps: number;
}

const { currentStep, totalSteps } = Astro.props;
---

<div class="flex items-center gap-2">
  {Array.from({ length: totalSteps }, (_, i) => (
    <div class="flex items-center gap-2">
      <div
        class:list={[
          'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium',
          i + 1 < currentStep ? 'bg-primary text-white' :
          i + 1 === currentStep ? 'bg-primary text-white' :
          'bg-gray-200 text-gray-500',
        ]}
      >
        {i + 1 < currentStep ? '✓' : i + 1}
      </div>
      {i + 1 < totalSteps && (
        <div
          class:list={[
            'h-0.5 w-12',
            i + 1 < currentStep ? 'bg-primary' : 'bg-gray-200',
          ]}
        />
      )}
    </div>
  ))}
</div>
```

---

## 9. Onboarding State Management

### Client-Side State

```typescript
// src/lib/onboarding.ts

interface OnboardingState {
  step: number;
  shop: {
    name: string;
    category: string;
    phone: string;
    lineId: string;
  };
  deals: Array<{
    title: string;
    category: string;
    discountText: string;
    endDate: string;
    couponCode?: string;
  }>;
}

const STORAGE_KEY = 'dealdoor_onboarding';

export function getOnboardingState(): OnboardingState {
  if (typeof window === 'undefined') {
    return getDefaultState();
  }

  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    return JSON.parse(saved);
  }

  return getDefaultState();
}

export function saveOnboardingState(state: OnboardingState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearOnboardingState(): void {
  localStorage.removeItem(STORAGE_KEY);
}

function getDefaultState(): OnboardingState {
  return {
    step: 1,
    shop: {
      name: '',
      category: '',
      phone: '',
      lineId: '',
    },
    deals: [],
  };
}
```

---

## 10. Onboarding Completion

### Save to Database

```typescript
// src/pages/api/onboarding/complete.ts

import type { APIRoute } from 'astro';
import { createShop, createDeal } from '../../../lib/mutations';
import { generateSlug } from '../../../lib/utils';

export const POST: APIRoute = async ({ request }) => {
  const data = await request.json();

  // Create shop
  const shopId = await createShop({
    slug: generateSlug(data.shop.name),
    name: data.shop.name,
    category: data.shop.category,
    phone: data.shop.phone || null,
    lineId: data.shop.lineId || null,
    // ... other fields
  });

  // Create deals
  for (const deal of data.deals) {
    await createDeal({
      shopId,
      title: deal.title,
      category: deal.category,
      discountText: deal.discountText,
      endDate: new Date(deal.endDate),
      claimType: deal.couponCode ? 'copy_code' : 'show_at_shop',
      couponCode: deal.couponCode || null,
      isActive: true,
    });
  }

  return new Response(JSON.stringify({
    success: true,
    slug: generateSlug(data.shop.name),
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
```

---

## 11. Post-Onboarding

### Dashboard First View

```
┌─────────────────────────────────┐
│  🎉 ยินดีต้อนรับ!               │
│                                 │
│   หน้าร้านของคุณพร้อมใช้งานแล้ว │
│                                 │
│   สิ่งที่คุณทำได้ต่อ:           │
│   • เพิ่มโปรโมชัน更多            │
│   • อัปโหลดรูปปกและโลโก้       │
│   • เพิ่มเมนู/สินค้า            │
│   • แชร์ลิงก์ให้ลูกค้า          │
│                                 │
│   [ดูหน้าร้าน] [เพิ่มดีล]       │
│                                 │
└─────────────────────────────────┘
```

### Email Welcome (Future)

```
Subject: หน้าร้านของคุณพร้อมแล้ว! 🎉

สวัสดีคุณ {name},

ยินดีต้อนรับสู่ DealDoor!

หน้าร้านของคุณ: {shop_url}

ขั้นตอนถัดไป:
1. เพิ่มโปรโมชัน更多
2. แชร์ลิงก์ให้ลูกค้า
3. ติดตามผลตอบรับ

[เปิดแดชบอร์ด]
```

---

## 12. Onboarding Analytics

| Event | Trigger | Data |
|-------|---------|------|
| `onboarding_start` | Click "Create Shop Page" | - |
| `onboarding_step_complete` | Complete each step | step number |
| `onboarding_abandon` | Leave before completion | last step |
| `onboarding_complete` | Finish all steps | time taken |

---

## 13. Skip Onboarding Option

For merchants who want to explore first:

```
┌─────────────────────────────────┐
│   ข้ามการตั้งค่า                 │
│   สร้างหน้าร้านทีหลัง           │
│                                 │
│   [ดูตัวอย่างก่อน →]            │
└─────────────────────────────────┘
```

---

## 14. Mobile Onboarding

Same flow, adapted for mobile:

```
┌─────────────────────┐
│ ← Back   1/3        │
├─────────────────────┤
│                     │
│  ตั้งค่าร้าน         │
│                     │
│  ชื่อร้าน *         │
│  ┌─────────────────┐│
│  │                 ││
│  └─────────────────┘│
│                     │
│  ประเภทร้าน *       │
│  ┌─────────────────┐│
│  │ เลือก     ▼    ││
│  └─────────────────┘│
│                     │
│  [ถัดไป →]          │
│                     │
└─────────────────────┘
```

---

## 15. File Structure

```
src/
├── pages/
│   └── onboarding/
│       ├── index.astro        # Step 1: Shop setup
│       ├── deals.astro        # Step 2: Add deals
│       └── complete.astro     # Step 3: Preview & share
├── components/
│   └── onboarding/
│       ├── ProgressBar.tsx
│       ├── ShopSetupForm.tsx
│       ├── DealQuickAdd.tsx
│       └── ShareSuccess.tsx
└── lib/
    └── onboarding.ts          # State management
```
