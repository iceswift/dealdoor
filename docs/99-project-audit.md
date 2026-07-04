# DealDoor — Project Audit & Roadmap

> Vision: "Restaurant for Linktree" — A centralized hub for shop info, deals, amenities, and accessibility

---

## Current State Analysis

### Total Files: 96 source files
- Pages: 30
- Components: 30
- Lib/Utils: 20
- Layouts: 3
- Tests: 4
- i18n: 3

---

## VERDICT: KEEP, CUT, OR REWORK

### ✅ KEEP (Core — Works Well)

| Component | Why Keep |
|-----------|----------|
| `ShopHeader.astro` | Core: shop identity display |
| `DealCard.astro` | Core: deal display |
| `DealDetailModal.tsx` | Good UX for deal details |
| `ContactButtons.tsx` | Essential: LINE, phone, map |
| `CountdownBadge.astro` | Unique feature: auto-expiring deals |
| `CategoryBadge.astro` | Visual categorization |
| `SaveButton.tsx` | Customer engagement |
| `FavoriteButton.tsx` | Customer engagement |
| `ShareButton` (in DealCard) | Viral growth |
| `BaseLayout.astro` | Foundation |
| `db.ts` + `schema.ts` | Data foundation |
| `auth.ts` | Needed for merchants |
| `utils.ts` | Core utilities |
| `constants.ts` | Shared constants |
| `validations.ts` | Input safety |
| `security.ts` | Security foundation |
| `errors.ts` | Error handling |

### ❌ CUT (Over-engineered for MVP)

| Component | Why Cut |
|-----------|---------|
| `AccessibleDropdown.tsx` | Overkill, native select works |
| `AccessibleFormField.tsx` | Overkill, use plain labels |
| `AccessibleModal.tsx` | Overkill, use simple modal |
| `AccessibleToast.tsx` | Overkill, use alert() for MVP |
| `OptimizedImage.astro` | Overkill, use native img |
| `ServiceWorkerRegistration.astro` | Not needed for MVP |
| `InstallPrompt.tsx` | Not needed for MVP |
| `NotificationBell.tsx` | Not needed for MVP |
| `content-filter.ts` | Not needed for MVP |
| `error-tracking.ts` | Not needed for MVP |
| `logger.ts` | Not needed for MVP |
| `cache.ts` | Not needed for MVP |
| `analytics.ts` | Not needed for MVP |
| `notifications.ts` | Not needed for MVP |
| `reports.ts` | Not needed for MVP |
| `admin/monitor.astro` | Not needed for MVP |
| `admin/moderation.astro` | Not needed for MVP |
| `admin/accessibility.astro` | Not needed for MVP |
| `api/analytics/*` | Not needed for MVP |
| `api/notifications/*` | Not needed for MVP |
| `api/reports/*` | Not needed for MVP |
| `api/admin/*` | Not needed for MVP |
| `saved/index.astro` | Low priority for MVP |
| `cookies.astro` | Low priority |
| `privacy/*` | Low priority |
| `terms.astro` | Low priority |
| `pricing.astro` | Not needed for MVP |

### 🔧 REWORK (Needs Improvement)

| Component | What to Fix |
|-----------|-------------|
| `ShopInfo.astro` | Add amenities, accessibility info |
| `MenuList.astro` | Rename to "Catalog", support more item types |
| `DealForm.tsx` | Simplify, fewer fields |
| `ShopForm.tsx` | Add new fields (amenities, payment, etc.) |
| `DashboardLayout.astro` | Simplify tabs |
| `ExploreDealCard.astro` | Show more shop info |
| `onboarding/*` | Simplify to 2 steps |

---

## NEW VISION: Enhanced Shop Page

### What a Shop Page Should Show

```
┌─────────────────────────────────────────┐
│  [Cover Image]                          │
│  [Logo]  Shop Name                      │
│          Category · Location            │
│          ⭐ 4.5 (123 reviews)           │
│                                         │
│  [Map] [LINE] [Call] [Facebook]         │
├─────────────────────────────────────────┤
│  🔥 Current Deals (3)                  │
│  ┌─────────────────────────────────┐   │
│  │ Birthday Free Brownie           │   │
│  │ ฟรีบราวนี่ เมื่อสั่งเครื่องดื่ม   │   │
│  │ ⏰ หมดอายุ: 31 ก.ค.            │   │
│  │ [คัดลอกโค้ด] [แชร์]            │   │
│  └─────────────────────────────────┘   │
├─────────────────────────────────────────┤
│  📋 Menu / Products                    │
│  ┌─────────┐ Brownie      ฿89         │
│  │  Image  │ Matcha Latte ฿120        │
│  └─────────┘ Berry Smoothie ฿130      │
├─────────────────────────────────────────┤
│  ℹ️ About This Shop                    │
│  คาเฟ่ขนมหวานสไตล์เกาหลี ย่านสยาม     │
├─────────────────────────────────────────┤
│  📍 Location & Hours                   │
│  123 ซอยสยามสแควร์ 5                   │
│  เปิด: จ-พฤ 10:00-20:00               │
│  [Open in Google Maps]                 │
├─────────────────────────────────────────┤
│  💳 Payment Methods                    │
│  [PromptPay] [Cash] [Credit Card]      │
│  [TrueMoney] [Rabbit LINE Pay]         │
├─────────────────────────────────────────┤
│  ♿ Accessibility                      │
│  [Wheelchair] [Stroller] [Senior WC]   │
│  [Elevator] [Braille Menu]             │
├─────────────────────────────────────────┤
│  🅿️ Parking & Transport               │
│  [Free Parking] [EV Charging]          │
│  [BTS: Siam 500m] [Motorcycle Parking] │
├─────────────────────────────────────────┤
│  🐾 Pet Policy                         │
│  [Pet Friendly] [Pet Menu]             │
│  [Water Bowl Available]                │
├─────────────────────────────────────────┤
│  👶 Family Facilities                  │
│  [Kids Menu] [High Chairs]             │
│  [Play Area] [Baby Changing]           │
├─────────────────────────────────────────┤
│  🔗 Social & Links                    │
│  [LINE] [Facebook] [Instagram]         │
│  [TikTok] [Website]                    │
├─────────────────────────────────────────┤
│  สร้างโดย DealDoor                    │
│  [Create Your Shop Page]               │
└─────────────────────────────────────────┘
```

---

## NEW DATABASE SCHEMA

### Add to `shops` table

```typescript
// Payment methods
acceptsPromptPay: boolean('accepts_prompt_pay').default(false),
acceptsCash: boolean('accepts_cash').default(true),
acceptsCreditCard: boolean('accepts_credit_card').default(false),
acceptsTrueMoney: boolean('accepts_true_money').default(false),
acceptsRabbitLinePay: boolean('accepts_rabbit_line_pay').default(false),
paymentNotes: text('payment_notes'),

// Accessibility
wheelchairAccessible: boolean('wheelchair_accessible').default(false),
strollerAccessible: boolean('stroller_accessible').default(false),
seniorFriendlyRestroom: boolean('senior_friendly_restroom').default(false),
elevatorAvailable: boolean('elevator_available').default(false),
brailleMenu: boolean('braille_menu').default(false),
accessibilityNotes: text('accessibility_notes'),

// Parking & Transport
freeParking: boolean('free_parking').default(false),
paidParking: boolean('paid_parking').default(false),
motorcycleParking: boolean('motorcycle_parking').default(false),
evCharging: boolean('ev_charging').default(false),
nearbyBts: text('nearby_bts'),           // e.g., "Siam 500m"
nearbyMrt: text('nearby_mrt'),           // e.g., "Lumphini 300m"
parkingNotes: text('parking_notes'),

// Pet Policy
petFriendly: boolean('pet_friendly').default(false),
petMenu: boolean('pet_menu').default(false),
petWaterBowl: boolean('pet_water_bowl').default(false),
petNotes: text('pet_notes'),

// Family
kidsMenu: boolean('kids_menu').default(false),
highChairs: boolean('high_chairs').default(false),
playArea: boolean('play_area').default(false),
babyChanging: boolean('baby_changing').default(false),
familyNotes: text('family_notes'),

// Social Links
tiktokUrl: text('tiktok_url'),
lineOfficialUrl: text('line_official_url'),  // LINE Official Account
```

---

## SIMPLIFIED FILE STRUCTURE

```
src/
├── components/
│   ├── shop/
│   │   ├── ShopHeader.astro        ✅ Keep
│   │   ├── DealCard.astro          ✅ Keep
│   │   ├── DealDetailModal.tsx     ✅ Keep
│   │   ├── ContactButtons.tsx      ✅ Keep
│   │   ├── MenuList.astro          🔧 Rename to CatalogList
│   │   ├── ShopInfo.astro          🔧 Add amenities
│   │   ├── AmenitiesSection.astro  🆕 New
│   │   ├── PaymentMethods.astro    🆕 New
│   │   ├── AccessibilityInfo.astro 🆕 New
│   │   ├── ParkingInfo.astro       🆕 New
│   │   └── PetPolicy.astro         🆕 New
│   ├── dashboard/
│   │   ├── ShopForm.tsx            🔧 Add new fields
│   │   ├── DealForm.tsx            🔧 Simplify
│   │   ├── DealList.tsx            ✅ Keep
│   │   ├── ShareLink.tsx           ✅ Keep
│   │   └── QRCodeSection.tsx       ✅ Keep
│   ├── explore/
│   │   ├── CategoryChips.astro     ✅ Keep
│   │   ├── SearchBar.tsx           ✅ Keep
│   │   └── ExploreDealCard.astro   ✅ Keep
│   └── shared/
│       ├── ThemeToggle.astro       ✅ Keep
│       ├── SaveButton.tsx          ✅ Keep
│       ├── FavoriteButton.tsx      ✅ Keep
│       └── CountdownBadge.astro    ✅ Keep
├── pages/
│   ├── index.astro                 ✅ Keep
│   ├── [slug].astro                🔧 Enhance
│   ├── explore/
│   │   ├── index.astro             ✅ Keep
│   │   ├── [category].astro        ✅ Keep
│   │   └── search.astro            ✅ Keep
│   ├── auth/
│   │   ├── login.astro             ✅ Keep
│   │   └── register.astro          ✅ Keep
│   ├── dashboard/
│   │   ├── index.astro             🔧 Simplify
│   │   ├── deals.astro             ✅ Keep
│   │   └── preview.astro           ✅ Keep
│   └── onboarding/
│       ├── index.astro             🔧 Add amenities step
│       ├── deals.astro             ✅ Keep
│       └── complete.astro          ✅ Keep
├── lib/
│   ├── db.ts                       ✅ Keep
│   ├── auth.ts                     ✅ Keep
│   ├── utils.ts                    ✅ Keep
│   ├── constants.ts                🔧 Add amenity constants
│   └── validations.ts              ✅ Keep
└── layouts/
    ├── BaseLayout.astro            ✅ Keep
    └── DashboardLayout.astro       🔧 Simplify
```

---

## FILES TO DELETE

```
src/components/shared/AccessibleDropdown.tsx
src/components/shared/AccessibleFormField.tsx
src/components/shared/AccessibleModal.tsx
src/components/shared/AccessibleToast.tsx
src/components/shared/OptimizedImage.astro
src/components/shared/ServiceWorkerRegistration.astro
src/components/shared/InstallPrompt.tsx
src/components/shared/NotificationBell.tsx
src/components/shared/ImageUpload.tsx
src/components/shared/QRCode.tsx
src/components/shared/ReportButton.tsx
src/components/shared/CookieBanner.tsx
src/components/dashboard/UpgradeBanner.tsx
src/components/dashboard/LivePreview.tsx
src/components/dashboard/DealFormEditWrapper.tsx
src/components/dashboard/ShopFormWrapper.tsx
src/components/dashboard/analytics/StatsOverview.tsx
src/components/dashboard/analytics/TopDeals.tsx
src/components/onboarding/ProgressIndicator.tsx
src/components/onboarding/ShareSuccess.tsx
src/components/explore/CategoryChips.astro (simplify)

src/pages/admin/monitor.astro
src/pages/admin/moderation.astro
src/pages/admin/accessibility.astro
src/pages/saved/index.astro
src/pages/pricing.astro
src/pages/cookies.astro
src/pages/terms.astro
src/pages/privacy/index.astro
src/pages/privacy/request.astro
src/pages/dashboard/analytics.astro
src/pages/explore/search.astro (simplify)

src/pages/api/analytics/stats.ts
src/pages/api/analytics/track.ts
src/pages/api/notifications/index.ts
src/pages/api/notifications/[id]/read.ts
src/pages/api/reports/index.ts
src/pages/api/reports/[id]/action.ts
src/pages/api/admin/stats.ts
src/pages/api/qr/[slug].ts

src/lib/analytics.ts
src/lib/cache.ts
src/lib/content-filter.ts
src/lib/error-tracking.ts
src/lib/logger.ts
src/lib/notifications.ts
src/lib/onboarding.ts (simplify)
src/lib/reports.ts
src/lib/saved-deals.ts
src/lib/seo.ts (simplify)
src/lib/tiers.ts (remove for MVP)
src/lib/toast.ts
src/lib/upload.ts (simplify)
src/lib/accessibility.ts (simplify)

src/lib/__tests__/seo.test.ts
src/lib/__tests__/errors.test.ts
```

---

## PRIORITY ORDER FOR NEW FEATURES

### Phase 1: Core Shop Page Enhancement (Week 1)
1. Add amenities fields to database schema
2. Create `AmenitiesSection` component
3. Create `PaymentMethods` component
4. Create `AccessibilityInfo` component
5. Update shop page layout

### Phase 2: Dashboard Update (Week 2)
1. Update `ShopForm` with amenity fields
2. Simplify dashboard layout
3. Improve onboarding flow

### Phase 3: Explore Enhancement (Week 3)
1. Add amenity filters to explore
2. Add "Pet Friendly" filter
3. Add "Wheelchair Accessible" filter
4. Add "EV Charging" filter

---

## SUMMARY

| Category | Count | Action |
|----------|-------|--------|
| Keep as-is | 25 | No changes |
| Rework | 10 | Improve |
| Delete | 35+ | Remove |
| New | 5 | Create |

**Result:** Simpler, more focused codebase with enhanced shop profiles.
