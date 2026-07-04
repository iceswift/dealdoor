# DealDoor — Monetization & Tier Design

---

## 1. Monetization Strategy

### Phase 1: MVP (Now)
- **Free only** — no payment system
- Focus on merchant value and product-market fit
- Show upgrade prompts as "Coming Soon"

### Phase 2: Freemium (After 50+ merchants)
- Introduce Pro tier
- Monthly subscription via Omise (Thai payment gateway)
- Start with simple upgrade flow

### Phase 3: Marketplace (After 500+ merchants)
- Featured placement
- Promoted deals
- Analytics dashboard

---

## 2. Tier Comparison

| Feature | Free | Pro (Coming Soon) |
|---------|------|-------------------|
| Shop pages | 1 | 1 (multiple branches later) |
| Active deals | 6 | Unlimited |
| Deal categories | Fixed set | Custom categories |
| Shop info | Basic | Full |
| Menu items | 10 | Unlimited |
| Cover image | Yes | Yes |
| Logo | Yes | Yes |
| Contact links | Yes | Yes |
| Map preview | Basic | Enhanced |
| Shareable link | Yes | Yes |
| QR code | No | Yes |
| Analytics | No | Yes |
| Coupon tracking | No | Yes |
| Custom branding | No | Yes |
| Scheduled deals | No | Yes |
| Featured placement | No | Yes |
| Priority support | No | Yes |

---

## 3. Free Tier Design

### 3.1 Limitations

```typescript
export const FREE_TIER_LIMITS = {
  maxShops: 1,
  maxActiveDeals: 6,
  maxMenuItems: 10,
  maxDealCategories: 9, // Fixed set
  hasQrCode: false,
  hasAnalytics: false,
  hasCustomBranding: false,
  hasScheduledDeals: false,
  hasFeaturedPlacement: false,
};
```

### 3.2 Deal Limit Enforcement

When merchant tries to create a 7th active deal:

```
┌─────────────────────────────────┐
│                                 │
│  ⚠️ จำกัดดีลสูงสุด 6 ดีล       │
│                                 │
│  อัปเกรดเป็น Pro เพื่อเพิ่มดีล  │
│  ได้ไม่จำกัด                    │
│                                 │
│  [อัปเกรดเป็น Pro (Coming Soon)]│
│                                 │
│  หรือ ปิดใช้งานดีลเก่าก่อน     │
│                                 │
└─────────────────────────────────┘
```

### 3.3 UI Indicators

**Dashboard badge:**
```
┌────────────────────────────┐
│ Free Plan · 3/6 ดีล        │
│ [⬆️ อัปเกรดเป็น Pro]      │
└────────────────────────────┘
```

**Locked features:**
```
┌────────────────────────────┐
│ 🔒 QR Code                 │
│    Coming soon in Pro      │
└────────────────────────────┘
```

---

## 4. Pro Tier Design (Coming Soon)

### 4.1 Pricing (Future)

| Plan | Price | Billing |
|------|-------|---------|
| Monthly | ฿299/เดือน | รายเดือน |
| Annual | ฿2,499/ปี | รายปี (ประหยัด 30%) |

### 4.2 Pro Features Detail

#### Unlimited Deals
- No limit on active deals
- Create seasonal campaigns
- Schedule deals in advance

#### Custom Deal Categories
- Create custom category names
- Custom category colors
- Category icons

#### QR Code Tools
- Auto-generated QR code for shop page
- QR code for individual deals
- Download as PNG/SVG
- Print-ready format

#### Analytics
- Page views
- Deal views
- Click-through rates
- Popular deals
- Traffic sources
- Peak hours

#### Coupon Tracking
- Track coupon usage
- Unique codes per customer
- Usage limits
- Redemption history

#### Custom Branding
- Custom colors
- Custom fonts
- Remove DealDoor branding
- Custom domain (future)

#### Scheduled Deals
- Set start date for deals
- Auto-publish deals
- Seasonal campaigns
- Flash sale scheduling

#### Featured Placement
- Appear in Explore page
- Priority in search results
- "Featured" badge
- Homepage spotlight

---

## 5. Upgrade Prompt Design

### 5.1 Dashboard Banner

```astro
---
// Shown on free tier dashboard
---

<div class="rounded-lg border border-primary-light bg-primary-light/50 p-4">
  <div class="flex items-center justify-between">
    <div>
      <p class="text-sm font-medium text-primary-dark">
        อัปเกรดเป็น Pro
      </p>
      <p class="mt-1 text-xs text-gray-600">
        ดีลไม่จำกัด + QR Code + Analytics
      </p>
    </div>
    <button class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white">
      เร็วๆ นี้
    </button>
  </div>
</div>
```

### 5.2 Feature Lock Card

```astro
---
// Shown for locked features
---

<div class="relative overflow-hidden rounded-lg border opacity-60">
  <div class="absolute inset-0 flex items-center justify-center bg-white/80">
    <div class="text-center">
      <span class="text-2xl">🔒</span>
      <p class="mt-1 text-sm font-medium text-gray-600">Pro Feature</p>
      <p class="text-xs text-gray-500">Coming soon</p>
    </div>
  </div>
  <!-- Disabled feature content -->
</div>
```

### 5.3 Deal Limit Warning

```tsx
// Shown when approaching deal limit
function DealLimitWarning({ current, max }: { current: number; max: number }) {
  const remaining = max - current;
  
  if (remaining > 2) return null;
  
  return (
    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
      <div className="flex items-center gap-2">
        <span className="text-yellow-600">⚠️</span>
        <p className="text-sm text-yellow-800">
          {remaining === 0
            ? 'คุณใช้ดีลครบแล้ว'
            : `เหลืออีก ${remaining} ดีล`}
        </p>
      </div>
      {remaining === 0 && (
        <p className="mt-1 text-xs text-yellow-700">
          ปิดใช้งานดีลเก่า หรืออัปเกรดเป็น Pro
        </p>
      )}
    </div>
  );
}
```

---

## 6. Upgrade Flow (Future)

```
User clicks [อัปเกรดเป็น Pro] →
  ├── Show pricing modal
  ├── Select plan (monthly/annual)
  ├── Enter payment info (Omise)
  ├── Confirm payment
  ├── Update tier in database
  └── Show success message
```

### Payment Integration (Future)

```typescript
// Future implementation with Omise
import Omise from 'omise';

const omise = Omise({
  publicKey: process.env.OMISE_PUBLIC_KEY,
  secretKey: process.env.OMISE_SECRET_KEY,
});

export async function createCharge(customerId: string, plan: 'monthly' | 'annual') {
  const amount = plan === 'monthly' ? 29900 : 249900; // satang
  
  const charge = await omise.charges.create({
    amount,
    currency: 'thb',
    customer: customerId,
    description: `DealDoor Pro - ${plan}`,
  });

  return charge;
}
```

---

## 7. Revenue Projections (Illustrative)

### Year 1 Goals

| Metric | Target |
|--------|--------|
| Total merchants | 100 |
| Free merchants | 80 |
| Pro merchants | 20 |
| Conversion rate | 20% |
| MRR | ฿5,980 |
| ARR | ฿71,760 |

### Year 2 Goals

| Metric | Target |
|--------|--------|
| Total merchants | 500 |
| Free merchants | 350 |
| Pro merchants | 150 |
| Conversion rate | 30% |
| MRR | ฿44,850 |
| ARR | ฿538,200 |

---

## 8. Competitive Pricing

| Platform | Price | Features |
|----------|-------|----------|
| Linktree Pro | $9/mo | Links, analytics, themes |
| Beacons.ai | $10/mo | Links, media kit, invoicing |
| Later | $25/mo | Social scheduling, link in bio |
| **DealDoor Pro** | **฿299/mo** | **Deals, QR, analytics** |

**Positioning:** More affordable than social media tools, more specialized for local deals.

---

## 9. Key Metrics to Track

| Metric | Description | Target |
|--------|-------------|--------|
| Merchant signups | New merchants per week | 10+ |
| Active merchants | Merchants with active deals | 60%+ |
| Deal creation rate | Deals created per merchant/week | 2+ |
| Page views | Views per shop page | 100+/month |
| Share rate | % of page views from shared links | 50%+ |
| Conversion rate | Free to Pro upgrade | 15%+ |
| Churn rate | Pro cancellations | <5%/month |

---

## 10. Future Revenue Streams

### Phase 3: Marketplace Revenue

| Stream | Description | Pricing |
|--------|-------------|---------|
| Featured deals | Promoted placement in Explore | ฿500/week |
| Sponsored listings | Top of search results | ฿1,000/week |
| Deal campaigns | Seasonal promotions | ฿2,000/campaign |
| Merchant verification | Verified badge | ฿500/year |

### Phase 4: Advanced Services

| Stream | Description | Pricing |
|--------|-------------|---------|
| Multi-branch | Multiple shop locations | ฿499/branch/month |
| API access | Integration with POS | ฿999/month |
| White-label | Custom branded solution | Custom pricing |
| Advertising | Display ads on explore | CPM/CPC model |
