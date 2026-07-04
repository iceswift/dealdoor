# DealDoor — Analytics Design

---

## 1. Overview

Analytics help merchants understand their shop page performance and help DealDoor track product metrics.

---

## 2. Analytics Layers

| Layer | Tool | Purpose |
|-------|------|---------|
| Product | Plausible / Umami | Privacy-friendly page analytics |
| Merchant | Custom dashboard | Shop-specific metrics |
| Events | Custom tracking | Deal interactions |

---

## 3. Privacy-First Approach

### 3.1 No Cookies, No PII

- Use Plausible or Umami (no cookies, GDPR compliant)
- No personal data collection
- Aggregate metrics only

### 3.2 Recommended: Plausible

```astro
<!-- Add to BaseLayout.astro -->
<script defer data-domain="dealdoor.co" src="https://plausible.io/js/script.js"></script>
```

---

## 4. Event Tracking

### 4.1 Event Schema

```typescript
// src/lib/analytics.ts

export interface AnalyticsEvent {
  type: EventType;
  shopId: string;
  dealId?: string;
  metadata?: Record<string, string | number>;
  timestamp: Date;
}

export type EventType =
  | 'page_view'
  | 'deal_view'
  | 'deal_click'
  | 'deal_share'
  | 'deal_copy_code'
  | 'contact_click'
  | 'map_click'
  | 'qr_scan';

export async function trackEvent(event: AnalyticsEvent): Promise<void> {
  // Store in SQLite for MVP
  await db.insert(analyticsEvents).values({
    id: createId(),
    type: event.type,
    shopId: event.shopId,
    dealId: event.dealId || null,
    metadata: event.metadata ? JSON.stringify(event.metadata) : null,
    createdAt: event.timestamp,
  });
}
```

### 4.2 Database Schema

```typescript
// db/schema.ts (additions)

export const analyticsEvents = sqliteTable('analytics_events', {
  id: text('id').primaryKey(),
  type: text('type').notNull(),
  shopId: text('shop_id').notNull().references(() => shops.id),
  dealId: text('deal_id').references(() => deals.id),
  metadata: text('metadata'), // JSON string
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// Aggregated daily stats (for performance)
export const dailyStats = sqliteTable('daily_stats', {
  id: text('id').primaryKey(),
  shopId: text('shop_id').notNull().references(() => shops.id),
  date: text('date').notNull(), // YYYY-MM-DD
  pageViews: integer('page_views').default(0),
  dealViews: integer('deal_views').default(0),
  dealClicks: integer('deal_clicks').default(0),
  shares: integer('shares').default(0),
  uniqueVisitors: integer('unique_visitors').default(0),
});
```

---

## 5. Client-Side Tracking

### 5.1 Track Page View

```astro
---
// In shop page
import { trackEvent } from '../lib/analytics';

// Server-side tracking
await trackEvent({
  type: 'page_view',
  shopId: shop.id,
  timestamp: new Date(),
});
---
```

### 5.2 Track Deal Interactions

```tsx
// In DealCard.tsx

const handleDealClick = () => {
  trackEvent({
    type: 'deal_view',
    shopId,
    dealId: deal.id,
  });
};

const handleCopyCode = () => {
  navigator.clipboard.writeText(deal.couponCode!);
  
  trackEvent({
    type: 'deal_copy_code',
    shopId,
    dealId: deal.id,
    metadata: { code: deal.couponCode },
  });
  
  showToast('คัดลอกโค้ดแล้ว!', 'success');
};

const handleShare = () => {
  trackEvent({
    type: 'deal_share',
    shopId,
    dealId: deal.id,
  });
  
  // Share logic
};
```

### 5.3 Track Contact Clicks

```tsx
// In ContactButtons.tsx

const handleContactClick = (type: string) => {
  trackEvent({
    type: 'contact_click',
    shopId,
    metadata: { channel: type },
  });
};
```

---

## 6. Merchant Analytics Dashboard

### 6.1 Overview Card

```tsx
// src/components/dashboard/AnalyticsOverview.tsx

interface AnalyticsOverviewProps {
  shopId: string;
  period: '7d' | '30d' | '90d';
}

export default function AnalyticsOverview({ shopId, period }: AnalyticsOverviewProps) {
  const [stats, setStats] = useState({
    pageViews: 0,
    dealViews: 0,
    dealClicks: 0,
    shares: 0,
  });

  useEffect(() => {
    fetchStats(shopId, period).then(setStats);
  }, [shopId, period]);

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <StatCard
        label="Page Views"
        value={stats.pageViews}
        icon="👁️"
      />
      <StatCard
        label="Deal Views"
        value={stats.dealViews}
        icon="🏷️"
      />
      <StatCard
        label="Deal Clicks"
        value={stats.dealClicks}
        icon="👆"
      />
      <StatCard
        label="Shares"
        value={stats.shares}
        icon="📤"
      />
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="rounded-xl border p-4">
      <div className="text-2xl">{icon}</div>
      <div className="mt-2 text-2xl font-bold">{value.toLocaleString()}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}
```

### 6.2 Trend Chart

```tsx
// src/components/dashboard/AnalyticsChart.tsx

import { Line } from 'react-chartjs-2';

interface AnalyticsChartProps {
  data: Array<{ date: string; views: number; clicks: number }>;
}

export default function AnalyticsChart({ data }: AnalyticsChartProps) {
  const chartData = {
    labels: data.map(d => d.date),
    datasets: [
      {
        label: 'Page Views',
        data: data.map(d => d.views),
        borderColor: '#3B82F6',
        backgroundColor: '#3B82F620',
        fill: true,
      },
      {
        label: 'Deal Clicks',
        data: data.map(d => d.clicks),
        borderColor: '#FF6B35',
        backgroundColor: '#FF6B3520',
        fill: true,
      },
    ],
  };

  return (
    <div className="rounded-xl border p-4">
      <h3 className="mb-4 font-semibold">Trend</h3>
      <Line data={chartData} />
    </div>
  );
}
```

### 6.3 Top Deals

```tsx
// src/components/dashboard/TopDeals.tsx

interface TopDealsProps {
  deals: Array<{
    id: string;
    title: string;
    views: number;
    clicks: number;
    ctr: number;
  }>;
}

export default function TopDeals({ deals }: TopDealsProps) {
  return (
    <div className="rounded-xl border p-4">
      <h3 className="mb-4 font-semibold">Top Deals</h3>
      <div className="space-y-3">
        {deals.map((deal, index) => (
          <div key={deal.id} className="flex items-center gap-3">
            <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
            <div className="flex-1">
              <div className="font-medium">{deal.title}</div>
              <div className="text-sm text-gray-500">
                {deal.views} views · {deal.clicks} clicks · {deal.ctr}% CTR
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 7. Analytics Queries

### 7.1 Get Daily Stats

```typescript
// src/lib/analytics-queries.ts

import { sql } from 'drizzle-orm';
import { db } from './db';
import { analyticsEvents, dailyStats } from '../../db/schema';

export async function getDailyStats(shopId: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return db
    .select()
    .from(dailyStats)
    .where(
      sql`${dailyStats.shopId} = ${shopId} AND ${dailyStats.date} >= ${startDate.toISOString().split('T')[0]}`
    )
    .orderBy(dailyStats.date);
}

export async function aggregateDailyStats(shopId: string, date: string) {
  const startOfDay = new Date(date);
  const endOfDay = new Date(date);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const result = await db
    .select({
      type: analyticsEvents.type,
      count: sql<number>`count(*)`,
    })
    .from(analyticsEvents)
    .where(
      sql`${analyticsEvents.shopId} = ${shopId} 
          AND ${analyticsEvents.createdAt} >= ${startOfDay}
          AND ${analyticsEvents.createdAt} < ${endOfDay}`
    )
    .groupBy(analyticsEvents.type);

  const stats: Record<string, number> = {};
  result.forEach(row => {
    stats[row.type] = row.count;
  });

  await db.insert(dailyStats).values({
    id: createId(),
    shopId,
    date,
    pageViews: stats.page_view || 0,
    dealViews: stats.deal_view || 0,
    dealClicks: stats.deal_click || 0,
    shares: stats.deal_share || 0,
  });
}
```

### 7.2 Get Top Deals

```typescript
export async function getTopDeals(shopId: string, limit: number = 5) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return db
    .select({
      dealId: analyticsEvents.dealId,
      views: sql<number>`sum(case when ${analyticsEvents.type} = 'deal_view' then 1 else 0 end)`,
      clicks: sql<number>`sum(case when ${analyticsEvents.type} = 'deal_click' then 1 else 0 end)`,
    })
    .from(analyticsEvents)
    .where(
      sql`${analyticsEvents.shopId} = ${shopId} 
          AND ${analyticsEvents.dealId} IS NOT NULL
          AND ${analyticsEvents.createdAt} >= ${thirtyDaysAgo}`
    )
    .groupBy(analyticsEvents.dealId)
    .orderBy(sql`views DESC`)
    .limit(limit);
}
```

---

## 8. Analytics Dashboard Page

```astro
---
// src/pages/dashboard/analytics.astro

import DashboardLayout from '../../layouts/DashboardLayout.astro';
import AnalyticsOverview from '../../components/dashboard/AnalyticsOverview';
import AnalyticsChart from '../../components/dashboard/AnalyticsChart';
import TopDeals from '../../components/dashboard/TopDeals';

const shop = await getMerchantShop(Astro.locals.user.id);
const stats = await getDailyStats(shop.id, 30);
const topDeals = await getTopDeals(shop.id);
---

<DashboardLayout title="Analytics">
  <div class="space-y-6">
    <AnalyticsOverview client:load shopId={shop.id} period="30d" />
    <AnalyticsChart client:load data={stats} />
    <TopDeals client:load deals={topDeals} />
  </div>
</DashboardLayout>
```

---

## 9. Free vs Pro Analytics

| Feature | Free | Pro |
|---------|------|-----|
| Page views | 7 days | 90 days |
| Deal views | Yes | Yes |
| Deal clicks | Yes | Yes |
| Shares | Yes | Yes |
| Top deals | Top 3 | Top 10 |
| Trend chart | No | Yes |
| Export CSV | No | Yes |
| Real-time | No | Yes |

---

## 10. External Analytics Integration (Future)

### 10.1 Google Analytics 4

```astro
<!-- GA4 -->
<script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${GA_ID}');
</script>
```

### 10.2 Facebook Pixel

```astro
<script>
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', '${FB_PIXEL_ID}');
  fbq('track', 'PageView');
</script>
```

---

## 11. File Structure

```
src/
├── lib/
│   ├── analytics.ts          # Event tracking functions
│   └── analytics-queries.ts  # Database queries
├── components/
│   └── dashboard/
│       ├── AnalyticsOverview.tsx
│       ├── AnalyticsChart.tsx
│       └── TopDeals.tsx
└── pages/
    └── dashboard/
        └── analytics.astro
```
