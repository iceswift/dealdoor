# DealDoor — Testing Strategy

---

## 1. Overview

Testing ensures the MVP works correctly and provides a good user experience.

---

## 2. Testing Pyramid

```
        ┌───────────────┐
        │   E2E Tests   │  ← Few, critical flows
        ├───────────────┤
        │  Integration  │  ← API, DB, components
        ├───────────────┤
        │   Unit Tests  │  ← Utilities, helpers
        └───────────────┘
```

---

## 3. Testing Tools

| Tool | Purpose | Type |
|------|---------|------|
| Vitest | Unit & integration tests | Test runner |
| Playwright | E2E tests | Browser automation |
| Testing Library | Component tests | React testing |
| MSW | API mocking | Mock Service Worker |

---

## 4. Unit Tests

### 4.1 Utility Functions

```typescript
// src/lib/__tests__/utils.test.ts

import { describe, it, expect } from 'vitest';
import { generateSlug, getDealStatus, getDaysRemaining, formatPrice } from '../utils';

describe('generateSlug', () => {
  it('converts to lowercase', () => {
    expect(generateSlug('Moon Bowl Cafe')).toBe('moon-bowl-cafe');
  });

  it('replaces spaces with hyphens', () => {
    expect(generateSlug('Aroi Noodle House')).toBe('aroi-noodle-house');
  });

  it('removes special characters', () => {
    expect(generateSlug('ร้าน @test!')).toBe('ราน-test');
  });

  it('handles Thai characters', () => {
    expect(generateSlug('ร้านก๋วยเตี๋ยว')).toBe('รานกวยเตยว');
  });
});

describe('getDealStatus', () => {
  it('returns active for future end date', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    expect(getDealStatus({ endDate: futureDate, isActive: true })).toBe('active');
  });

  it('returns expiring_soon for end date within 24 hours', () => {
    const soonDate = new Date();
    soonDate.setHours(soonDate.getHours() + 12);
    expect(getDealStatus({ endDate: soonDate, isActive: true })).toBe('expiring_soon');
  });

  it('returns expired for past end date', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    expect(getDealStatus({ endDate: pastDate, isActive: true })).toBe('expired');
  });

  it('returns expired for inactive deal', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    expect(getDealStatus({ endDate: futureDate, isActive: false })).toBe('expired');
  });
});

describe('getDaysRemaining', () => {
  it('returns correct days', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    expect(getDaysRemaining(futureDate)).toBe(5);
  });

  it('returns 0 for past dates', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    expect(getDaysRemaining(pastDate)).toBeLessThanOrEqual(0);
  });
});

describe('formatPrice', () => {
  it('formats Thai Baht', () => {
    expect(formatPrice(120, 'th')).toBe('฿120');
  });

  it('formats with comma separator', () => {
    expect(formatPrice(1200, 'th')).toBe('฿1,200');
  });
});
```

### 4.2 Validation Functions

```typescript
// src/lib/__tests__/validations.test.ts

import { describe, it, expect } from 'vitest';
import { validateShop, validateDeal } from '../validations';

describe('validateShop', () => {
  it('requires name', () => {
    const errors = validateShop({ name: '', category: 'cafe' });
    expect(errors).toContainEqual(expect.objectContaining({ field: 'name' }));
  });

  it('requires category', () => {
    const errors = validateShop({ name: 'Test', category: '' });
    expect(errors).toContainEqual(expect.objectContaining({ field: 'category' }));
  });

  it('validates phone format', () => {
    const errors = validateShop({ name: 'Test', category: 'cafe', phone: 'invalid' });
    expect(errors).toContainEqual(expect.objectContaining({ field: 'phone' }));
  });

  it('passes with valid data', () => {
    const errors = validateShop({
      name: 'Test Shop',
      category: 'cafe',
      phone: '081-234-5678',
    });
    expect(errors).toHaveLength(0);
  });
});

describe('validateDeal', () => {
  it('requires title', () => {
    const errors = validateDeal({
      title: '',
      category: 'birthday',
      discountText: 'Free',
      endDate: '2025-12-31',
    });
    expect(errors).toContainEqual(expect.objectContaining({ field: 'title' }));
  });

  it('requires future end date', () => {
    const errors = validateDeal({
      title: 'Test',
      category: 'birthday',
      discountText: 'Free',
      endDate: '2020-01-01',
    });
    expect(errors).toContainEqual(expect.objectContaining({ field: 'endDate' }));
  });

  it('validates coupon code format', () => {
    const errors = validateDeal({
      title: 'Test',
      category: 'birthday',
      discountText: 'Free',
      endDate: '2025-12-31',
      couponCode: 'invalid code!',
    });
    expect(errors).toContainEqual(expect.objectContaining({ field: 'couponCode' }));
  });
});
```

---

## 5. Integration Tests

### 5.1 Database Queries

```typescript
// src/lib/__tests__/queries.test.ts

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '../db';
import { getShopBySlug, getActiveDealsByShopId } from '../queries';

describe('Database Queries', () => {
  beforeAll(async () => {
    // Setup test database
    await db.run(sql`DELETE FROM deals`);
    await db.run(sql`DELETE FROM shops`);
    // Insert test data
  });

  afterAll(async () => {
    // Cleanup
  });

  describe('getShopBySlug', () => {
    it('returns shop with relations', async () => {
      const shop = await getShopBySlug('moon-bowl-cafe');
      expect(shop).toBeDefined();
      expect(shop?.name).toBe('Moon Bowl Cafe');
      expect(shop?.deals).toBeInstanceOf(Array);
      expect(shop?.menuItems).toBeInstanceOf(Array);
    });

    it('returns null for non-existent slug', async () => {
      const shop = await getShopBySlug('non-existent');
      expect(shop).toBeNull();
    });
  });

  describe('getActiveDealsByShopId', () => {
    it('returns only active deals', async () => {
      const deals = await getActiveDealsByShopId('shop_001');
      expect(deals.every(d => d.isActive)).toBe(true);
    });

    it('excludes expired deals', async () => {
      const deals = await getActiveDealsByShopId('shop_001');
      const now = new Date();
      expect(deals.every(d => new Date(d.endDate) >= now)).toBe(true);
    });
  });
});
```

### 5.2 API Routes

```typescript
// src/pages/api/__tests__/deals.test.ts

import { describe, it, expect } from 'vitest';

describe('POST /api/deals', () => {
  it('creates a new deal', async () => {
    const response = await fetch('http://localhost:4321/api/deals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shopId: 'shop_001',
        title: 'Test Deal',
        category: 'birthday',
        discountText: 'Free',
        endDate: '2025-12-31',
        claimType: 'copy_code',
      }),
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.id).toBeDefined();
    expect(data.success).toBe(true);
  });

  it('validates required fields', async () => {
    const response = await fetch('http://localhost:4321/api/deals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(400);
  });
});
```

---

## 6. Component Tests

### 6.1 DealCard Component

```tsx
// src/components/shop/__tests__/DealCard.test.tsx

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import DealCard from '../DealCard';

const mockDeal = {
  id: 'deal_001',
  title: 'Birthday Free Brownie',
  category: 'birthday',
  shortDescription: 'Free brownie with any drink',
  discountText: 'Free brownie',
  endDate: new Date('2025-12-31'),
  isActive: true,
  claimType: 'copy_code',
  couponCode: 'MOONBDAY',
};

describe('DealCard', () => {
  it('renders deal title', () => {
    render(<DealCard deal={mockDeal} />);
    expect(screen.getByText('Birthday Free Brownie')).toBeDefined();
  });

  it('renders discount text', () => {
    render(<DealCard deal={mockDeal} />);
    expect(screen.getByText('Free brownie')).toBeDefined();
  });

  it('renders category badge', () => {
    render(<DealCard deal={mockDeal} />);
    expect(screen.getByText('Birthday')).toBeDefined();
  });

  it('shows countdown badge', () => {
    render(<DealCard deal={mockDeal} />);
    expect(screen.getByText(/เหลือ/)).toBeDefined();
  });

  it('shows copy code button for copy_code type', () => {
    render(<DealCard deal={mockDeal} />);
    expect(screen.getByText('คัดลอกโค้ด')).toBeDefined();
  });

  it('shows expired overlay for expired deals', () => {
    const expiredDeal = {
      ...mockDeal,
      endDate: new Date('2020-01-01'),
    };
    render(<DealCard deal={expiredDeal} />);
    expect(screen.getByText('หมดอายุแล้ว')).toBeDefined();
  });
});
```

---

## 7. E2E Tests

### 7.1 Shop Page Flow

```typescript
// tests/e2e/shop-page.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Shop Page', () => {
  test('displays shop information', async ({ page }) => {
    await page.goto('/moon-bowl-cafe');
    
    await expect(page.locator('h1')).toHaveText('Moon Bowl Cafe');
    await expect(page.locator('.shop-category')).toContainText('คาเฟ่');
  });

  test('displays active deals', async ({ page }) => {
    await page.goto('/moon-bowl-cafe');
    
    const dealCards = page.locator('.deal-card');
    await expect(dealCards).toHaveCount(3); // Active deals only
  });

  test('hides expired deals', async ({ page }) => {
    await page.goto('/moon-bowl-cafe');
    
    const expiredDeals = page.locator('.deal-card.expired');
    await expect(expiredDeals).toHaveCount(0);
  });

  test('shows countdown badge', async ({ page }) => {
    await page.goto('/moon-bowl-cafe');
    
    await expect(page.locator('.countdown-badge').first()).toBeVisible();
  });

  test('copies coupon code', async ({ page }) => {
    await page.goto('/moon-bowl-cafe');
    
    await page.locator('.copy-code-btn').first().click();
    await expect(page.locator('.toast')).toContainText('คัดลอกโค้ดแล้ว');
  });

  test('opens map link', async ({ page }) => {
    await page.goto('/moon-bowl-cafe');
    
    const mapLink = page.locator('a[href*="google.com/maps"]');
    await expect(mapLink).toBeVisible();
  });

  test('opens LINE link', async ({ page }) => {
    await page.goto('/moon-bowl-cafe');
    
    const lineLink = page.locator('a[href*="line.me"]');
    await expect(lineLink).toBeVisible();
  });
});
```

### 7.2 Deal Detail Modal

```typescript
// tests/e2e/deal-detail.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Deal Detail Modal', () => {
  test('opens modal on deal click', async ({ page }) => {
    await page.goto('/moon-bowl-cafe');
    
    await page.locator('.deal-card').first().click();
    await expect(page.locator('.deal-modal')).toBeVisible();
  });

  test('displays deal details', async ({ page }) => {
    await page.goto('/moon-bowl-cafe');
    
    await page.locator('.deal-card').first().click();
    await expect(page.locator('.deal-modal')).toContainText('Birthday');
    await expect(page.locator('.deal-modal')).toContainText('เงื่อนไข');
  });

  test('closes modal', async ({ page }) => {
    await page.goto('/moon-bowl-cafe');
    
    await page.locator('.deal-card').first().click();
    await page.locator('.modal-close').click();
    await expect(page.locator('.deal-modal')).not.toBeVisible();
  });
});
```

### 7.3 Dashboard Flow

```typescript
// tests/e2e/dashboard.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Merchant Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('displays shop info form', async ({ page }) => {
    await expect(page.locator('input[name="shopName"]')).toBeVisible();
    await expect(page.locator('select[name="category"]')).toBeVisible();
  });

  test('creates a new deal', async ({ page }) => {
    await page.locator('button:has-text("เพิ่มดีล")').click();
    
    await page.fill('input[name="title"]', 'New Deal');
    await page.fill('textarea[name="description"]', 'Deal description');
    await page.selectOption('select[name="category"]', 'birthday');
    await page.fill('input[name="discountText"]', 'Free item');
    await page.fill('input[name="endDate"]', '2025-12-31');
    
    await page.locator('button:has-text("บันทึก")').click();
    
    await expect(page.locator('.toast')).toContainText('บันทึกสำเร็จ');
    await expect(page.locator('.deal-item')).toContainText('New Deal');
  });

  test('shows deal limit warning', async ({ page }) => {
    // Create 6 deals (free tier limit)
    for (let i = 0; i < 6; i++) {
      await createDeal(page, { title: `Deal ${i + 1}` });
    }
    
    await expect(page.locator('.limit-warning')).toContainText('จำกัดดีลสูงสุด 6 ดีล');
  });

  test('copies share link', async ({ page }) => {
    await page.locator('button:has-text("คัดลอกลิงก์")').click();
    await expect(page.locator('.toast')).toContainText('คัดลอกแล้ว');
  });
});
```

### 7.4 Explore Page

```typescript
// tests/e2e/explore.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Explore Page', () => {
  test('displays deal cards', async ({ page }) => {
    await page.goto('/explore');
    
    const cards = page.locator('.deal-card');
    await expect(cards.first()).toBeVisible();
  });

  test('filters by category', async ({ page }) => {
    await page.goto('/explore');
    
    await page.locator('button:has-text("คาเฟ่")').click();
    
    const cards = page.locator('.deal-card');
    // All visible cards should be cafe category
    for (const card of await cards.all()) {
      await expect(card).toContainText('คาเฟ่');
    }
  });

  test('searches deals', async ({ page }) => {
    await page.goto('/explore');
    
    await page.fill('input[type="search"]', 'Birthday');
    await page.locator('button[type="submit"]').click();
    
    await expect(page.locator('.deal-card')).toContainText('Birthday');
  });

  test('shows expiring soon section', async ({ page }) => {
    await page.goto('/explore');
    
    await expect(page.locator('.expiring-soon')).toBeVisible();
  });
});
```

---

## 8. Visual Regression Tests

```typescript
// tests/visual/shop-page.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Visual Regression', () => {
  test('shop page matches snapshot', async ({ page }) => {
    await page.goto('/moon-bowl-cafe');
    await expect(page).toHaveScreenshot('shop-page.png');
  });

  test('deal card matches snapshot', async ({ page }) => {
    await page.goto('/moon-bowl-cafe');
    await expect(page.locator('.deal-card').first()).toHaveScreenshot('deal-card.png');
  });

  test('shop page mobile matches snapshot', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/moon-bowl-cafe');
    await expect(page).toHaveScreenshot('shop-page-mobile.png');
  });
});
```

---

## 9. Test Configuration

### 9.1 Vitest Config

```typescript
// vitest.config.ts

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,ts}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/lib/**'],
      exclude: ['src/lib/__tests__/**'],
    },
  },
});
```

### 9.2 Playwright Config

```typescript
// playwright.config.ts

import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## 10. Test Scripts

```json
// package.json

{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run src/lib",
    "test:integration": "vitest run src/pages/api",
    "test:component": "vitest run src/components",
    "test:e2e": "playwright test",
    "test:visual": "playwright test tests/visual",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui"
  }
}
```

---

## 11. Test Data

### 11.1 Test Fixtures

```typescript
// tests/fixtures/shops.ts

export const testShops = {
  cafe: {
    slug: 'test-cafe',
    name: 'Test Cafe',
    category: 'cafe',
    phone: '081-234-5678',
    lineId: '@testcafe',
  },
  restaurant: {
    slug: 'test-restaurant',
    name: 'Test Restaurant',
    category: 'restaurant',
  },
};

export const testDeals = {
  active: {
    title: 'Active Deal',
    category: 'birthday',
    discountText: 'Free item',
    endDate: '2025-12-31',
    isActive: true,
  },
  expiringSoon: {
    title: 'Expiring Soon',
    category: 'flash',
    discountText: '50% off',
    endDate: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
    isActive: true,
  },
  expired: {
    title: 'Expired Deal',
    category: 'monthly',
    discountText: '20% off',
    endDate: '2020-01-01',
    isActive: false,
  },
};
```

---

## 12. CI/CD Integration

```yaml
# .github/workflows/test.yml

name: Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
```

---

## 13. File Structure

```
tests/
├── e2e/
│   ├── shop-page.spec.ts
│   ├── deal-detail.spec.ts
│   ├── dashboard.spec.ts
│   └── explore.spec.ts
├── visual/
│   └── shop-page.spec.ts
└── fixtures/
    ├── shops.ts
    └── deals.ts

src/
├── lib/
│   └── __tests__/
│       ├── utils.test.ts
│       ├── validations.test.ts
│       └── queries.test.ts
└── components/
    └── shop/
        └── __tests__/
            └── DealCard.test.tsx

vitest.config.ts
playwright.config.ts
```
