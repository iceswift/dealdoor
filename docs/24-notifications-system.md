# DealDoor — Notifications System Design

---

## 1. Overview

Notifications keep merchants informed about their shop performance and deal status.

---

## 2. Notification Channels

| Channel | Use Case | Priority |
|---------|----------|----------|
| In-app | Dashboard alerts | MVP |
| Email | Deal expiration, weekly report | Phase 2 |
| LINE | Urgent alerts, deal reminders | Phase 2 |
| Push | Mobile/web push | Phase 3 |

---

## 3. Notification Types

### 3.1 Merchant Notifications

| Type | Trigger | Channel | Priority |
|------|---------|---------|----------|
| Deal expiring | 24h before expiration | Email, LINE | High |
| Deal expired | When deal expires | Email | Medium |
| New deal created | After deal creation | In-app | Low |
| Weekly report | Every Monday | Email | Medium |
| Shop milestone | 100 views, 10 shares | In-app, Email | Low |
| Limit warning | 5/6 deals used | In-app | Medium |
| Upgrade suggestion | After 30 days free | In-app, Email | Low |

### 3.2 Customer Notifications (Future)

| Type | Trigger | Channel | Priority |
|------|---------|---------|----------|
| New deal from saved shop | New deal added | Push | Medium |
| Deal expiring soon | 24h before expiration | Push | High |
| Birthday deals | Customer's birthday month | Push, Email | Medium |

---

## 4. Database Schema

```typescript
// db/schema.ts (additions)

export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id'),                    // null for system notifications
  shopId: text('shop_id').references(() => shops.id),
  type: text('type').notNull(),               // deal_expiring, deal_expired, etc.
  title: text('title').notNull(),
  message: text('message').notNull(),
  metadata: text('metadata'),                 // JSON: { dealId, dealTitle, etc. }
  read: integer('read', { mode: 'boolean' }).default(false),
  readAt: integer('read_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const notificationPreferences = sqliteTable('notification_preferences', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull(),
  emailEnabled: integer('email_enabled', { mode: 'boolean' }).default(true),
  lineEnabled: integer('line_enabled', { mode: 'boolean' }).default(false),
  dealExpiring: integer('deal_expiring', { mode: 'boolean' }).default(true),
  dealExpired: integer('deal_expired', { mode: 'boolean' }).default(true),
  weeklyReport: integer('weekly_report', { mode: 'boolean' }).default(true),
  milestones: integer('milestones', { mode: 'boolean' }).default(true),
});
```

---

## 5. Notification Service

```typescript
// src/lib/notifications.ts

import { db } from './db';
import { notifications } from '../../db/schema';
import { eq, and, desc } from 'drizzle-orm';

interface CreateNotificationParams {
  userId?: string;
  shopId: string;
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

export async function createNotification(params: CreateNotificationParams): Promise<string> {
  const id = createId();
  
  await db.insert(notifications).values({
    id,
    userId: params.userId || null,
    shopId: params.shopId,
    type: params.type,
    title: params.title,
    message: params.message,
    metadata: params.metadata ? JSON.stringify(params.metadata) : null,
    createdAt: new Date(),
  });

  // Send to other channels
  await sendToChannels(params);

  return id;
}

export async function getNotifications(shopId: string, limit = 20) {
  return db.query.notifications.findMany({
    where: eq(notifications.shopId, shopId),
    orderBy: [desc(notifications.createdAt)],
    limit,
  });
}

export async function getUnreadCount(shopId: string): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(
      and(
        eq(notifications.shopId, shopId),
        eq(notifications.read, false)
      )
    );
  return result[0]?.count || 0;
}

export async function markAsRead(notificationId: string): Promise<void> {
  await db.update(notifications)
    .set({ read: true, readAt: new Date() })
    .where(eq(notifications.id, notificationId));
}

export async function markAllAsRead(shopId: string): Promise<void> {
  await db.update(notifications)
    .set({ read: true, readAt: new Date() })
    .where(
      and(
        eq(notifications.shopId, shopId),
        eq(notifications.read, false)
      )
    );
}
```

---

## 6. Notification Triggers

### 6.1 Deal Expiration Check

```typescript
// src/jobs/check-deal-expiration.ts

import { db } from '../lib/db';
import { deals, shops } from '../../db/schema';
import { and, eq, lte, gte, sql } from 'drizzle-orm';
import { createNotification } from '../lib/notifications';

export async function checkDealExpiration(): Promise<void> {
  const now = new Date();
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // Find deals expiring in next 24 hours
  const expiringDeals = await db.query.deals.findMany({
    where: and(
      eq(deals.isActive, true),
      gte(deals.endDate, now),
      lte(deals.endDate, in24Hours)
    ),
    with: {
      shop: true,
    },
  });

  for (const deal of expiringDeals) {
    // Check if notification already sent today
    const existing = await db.query.notifications.findFirst({
      where: and(
        eq(notifications.type, 'deal_expiring'),
        sql`json_extract(${notifications.metadata}, '$.dealId') = ${deal.id}`,
        sql`date(${notifications.createdAt}) = date('now')`
      ),
    });

    if (!existing) {
      await createNotification({
        shopId: deal.shopId,
        type: 'deal_expiring',
        title: 'ดีลใกล้หมดอายุ',
        message: `"${deal.title}" จะหมดอายุในอีก 24 ชั่วโมง`,
        metadata: { dealId: deal.id, dealTitle: deal.title },
      });
    }
  }
}
```

### 6.2 Weekly Report

```typescript
// src/jobs/weekly-report.ts

export async function sendWeeklyReport(shopId: string): Promise<void> {
  const shop = await getShopById(shopId);
  if (!shop) return;

  const stats = await getWeeklyStats(shopId);

  await createNotification({
    shopId,
    type: 'weekly_report',
    title: 'รายงานประจำสัปดาห์',
    message: `สัปดาห์นี้: ${stats.pageViews} views, ${stats.dealClicks} clicks, ${stats.shares} shares`,
    metadata: stats,
  });

  // Send email
  await sendEmail({
    to: shop.merchant.email,
    subject: 'รายงานประจำสัปดาห์จาก DealDoor',
    template: 'weekly-report',
    data: { shop, stats },
  });
}
```

---

## 7. Notification Bell Component

```tsx
// src/components/shared/NotificationBell.tsx

import { useState, useEffect } from 'react';
import { getUnreadCount, getNotifications, markAsRead, markAllAsRead } from '../../lib/notifications';

export default function NotificationBell({ shopId }: { shopId: string }) {
  const [count, setCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadCount();
  }, [shopId]);

  const loadCount = async () => {
    const c = await getUnreadCount(shopId);
    setCount(c);
  };

  const handleOpen = async () => {
    if (!isOpen) {
      const data = await getNotifications(shopId, 20);
      setNotifications(data);
    }
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setCount(prev => Math.max(0, prev - 1));
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead(shopId);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setCount(0);
  };

  return (
    <div className="relative">
      <button onClick={handleOpen} className="relative p-2">
        <span className="text-xl">🔔</span>
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border bg-white shadow-lg">
          <div className="flex items-center justify-between border-b p-3">
            <h3 className="font-semibold">การแจ้งเตือน</h3>
            <button
              onClick={handleMarkAllAsRead}
              className="text-xs text-primary hover:underline"
            >
              อ่านทั้งหมด
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-center text-sm text-gray-500">ไม่มีการแจ้งเตือน</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`border-b p-3 ${!n.read ? 'bg-primary-light/50' : ''}`}
                  onClick={() => handleMarkAsRead(n.id)}
                >
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="mt-1 text-xs text-gray-500">{n.message}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {formatTimeAgo(n.createdAt)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 8. Email Templates

### 8.1 Deal Expiration Email

```html
<!-- emails/deal-expiring.html -->

<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Inter', sans-serif; background: #F7F7F8; }
    .container { max-width: 480px; margin: 0 auto; background: white; }
    .header { background: #FF6B35; padding: 24px; text-align: center; }
    .header h1 { color: white; margin: 0; }
    .content { padding: 24px; }
    .deal-card { border: 1px solid #E5E7EB; border-radius: 12px; padding: 16px; margin: 16px 0; }
    .button { display: inline-block; background: #FF6B35; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ ดีลใกล้หมดอายุ</h1>
    </div>
    <div class="content">
      <p>สวัสดีคุณ {{merchantName}},</p>
      <p>ดีลของคุณกำลังจะหมดอายุในอีก 24 ชั่วโมง:</p>
      
      <div class="deal-card">
        <h3>{{dealTitle}}</h3>
        <p>{{dealDescription}}</p>
        <p><strong>หมดอายุ:</strong> {{expirationDate}}</p>
      </div>
      
      <p>หากต้องการต่ออายุหรือแก้ไขดีล กรุณาเข้าสู่แดชบอร์ด:</p>
      <a href="{{dashboardUrl}}" class="button">เปิดแดชบอร์ด</a>
    </div>
  </div>
</body>
</html>
```

### 8.2 Weekly Report Email

```html
<!-- emails/weekly-report.html -->

<div class="content">
  <h2>📊 รายงานประจำสัปดาห์</h2>
  <p>สรุปผลสำหรับ {{shopName}}:</p>
  
  <div class="stats">
    <div class="stat">
      <span class="number">{{pageViews}}</span>
      <span class="label">Page Views</span>
    </div>
    <div class="stat">
      <span class="number">{{dealClicks}}</span>
      <span class="label">Deal Clicks</span>
    </div>
    <div class="stat">
      <span class="number">{{shares}}</span>
      <span class="label">Shares</span>
    </div>
  </div>
  
  <h3>ดีลยอดนิยม</h3>
  {{#each topDeals}}
  <div class="deal-item">
    <span>{{title}}</span>
    <span>{{views}} views</span>
  </div>
  {{/each}}
</div>
```

---

## 9. LINE Notification (Future)

```typescript
// src/lib/line-notify.ts

export async function sendLineNotification(
  lineId: string,
  message: string
): Promise<void> {
  // Using LINE Messaging API
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      to: lineId,
      messages: [{ type: 'text', text: message }],
    }),
  });
}
```

---

## 10. Job Scheduler

```typescript
// src/jobs/scheduler.ts

import { checkDealExpiration } from './check-deal-expiration';
import { sendWeeklyReport } from './weekly-report';
import { aggregateAnalytics } from './aggregate-analytics';

// Run every hour
export function startScheduler(): void {
  // Check deal expiration every hour
  setInterval(checkDealExpiration, 60 * 60 * 1000);

  // Send weekly reports every Monday at 9 AM
  scheduleWeekly(sendWeeklyReport, 1, 9);

  // Aggregate analytics daily at 2 AM
  scheduleDaily(aggregateAnalytics, 2);
}

function scheduleDaily(job: () => Promise<void>, hour: number): void {
  const now = new Date();
  const next = new Date();
  next.setHours(hour, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);

  const delay = next.getTime() - now.getTime();
  setTimeout(() => {
    job();
    setInterval(job, 24 * 60 * 60 * 1000);
  }, delay);
}

function scheduleWeekly(job: (shopId: string) => Promise<void>, day: number, hour: number): void {
  // Implementation for weekly scheduling
}
```

---

## 11. File Structure

```
src/
├── lib/
│   ├── notifications.ts        # Notification service
│   ├── line-notify.ts          # LINE integration
│   └── email/
│       ├── templates/          # Email templates
│       └── sender.ts           # Email sending
├── components/
│   └── shared/
│       └── NotificationBell.tsx
└── jobs/
    ├── scheduler.ts
    ├── check-deal-expiration.ts
    ├── weekly-report.ts
    └── aggregate-analytics.ts
```
