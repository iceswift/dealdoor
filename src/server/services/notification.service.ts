import { createId } from '@paralleldrive/cuid2';
import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { deals, notifications } from '../../lib/db-schema';
import { db } from '../../lib/db';
import { isToday, jsonTextEquals } from '../../lib/db-sql';

export type NotificationType = 'deal_expiring' | 'deal_expired' | 'milestone' | 'system';

export async function createNotification(params: {
  userId?: string;
  shopId?: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, any>;
}): Promise<string> {
  const id = createId();

  await db.insert(notifications).values({
    id,
    userId: params.userId || null,
    shopId: params.shopId || null,
    type: params.type,
    title: params.title,
    message: params.message,
    metadata: params.metadata ? JSON.stringify(params.metadata) : null,
  });

  return id;
}

export function normalizeNotificationListParams(url: URL, userId?: string) {
  const shopId = url.searchParams.get('shopId') || undefined;
  const limit = Math.min(100, Math.max(1, Number.parseInt(url.searchParams.get('limit') || '20', 10) || 20));
  const unreadOnly = url.searchParams.get('unread') === 'true';

  return {
    list: {
      userId,
      shopId,
      limit,
      unreadOnly,
    },
    count: {
      userId,
      shopId,
    },
  };
}

export async function getNotifications(params: {
  userId?: string;
  shopId?: string;
  limit?: number;
  unreadOnly?: boolean;
}) {
  const conditions = [];

  if (params.userId) {
    conditions.push(eq(notifications.userId, params.userId));
  }
  if (params.shopId) {
    conditions.push(eq(notifications.shopId, params.shopId));
  }
  if (params.unreadOnly) {
    conditions.push(eq(notifications.read, false));
  }

  return db.query.notifications.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: [desc(notifications.createdAt)],
    limit: params.limit || 20,
  });
}

export async function getUnreadCount(params: {
  userId?: string;
  shopId?: string;
}): Promise<number> {
  const conditions = [eq(notifications.read, false)];

  if (params.userId) {
    conditions.push(eq(notifications.userId, params.userId));
  }
  if (params.shopId) {
    conditions.push(eq(notifications.shopId, params.shopId));
  }

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(and(...conditions));

  return result[0]?.count || 0;
}

export async function getNotificationInbox(url: URL, userId?: string) {
  const params = normalizeNotificationListParams(url, userId);
  const notificationsList = await getNotifications(params.list);
  const unreadCount = await getUnreadCount(params.count);

  return {
    notifications: notificationsList,
    unreadCount,
  };
}

export async function markAsRead(notificationId: string): Promise<void> {
  await db.update(notifications)
    .set({ read: true, readAt: new Date() })
    .where(eq(notifications.id, notificationId));
}

export async function markAllAsRead(params: {
  userId?: string;
  shopId?: string;
}): Promise<void> {
  const conditions = [eq(notifications.read, false)];

  if (params.userId) {
    conditions.push(eq(notifications.userId, params.userId));
  }
  if (params.shopId) {
    conditions.push(eq(notifications.shopId, params.shopId));
  }

  await db.update(notifications)
    .set({ read: true, readAt: new Date() })
    .where(and(...conditions));
}

export async function markNotificationReadFromRequest(notificationId: string | undefined, rawData: unknown) {
  if (notificationId === 'all') {
    const data = rawData as { userId?: string; shopId?: string };
    await markAllAsRead({
      userId: data.userId,
      shopId: data.shopId,
    });
    return;
  }

  if (notificationId) {
    await markAsRead(notificationId);
  }
}

export async function checkDealExpiration(): Promise<void> {
  const now = new Date();
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

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
    if (!deal.shop) continue;

    const existing = await db.query.notifications.findFirst({
      where: and(
        eq(notifications.type, 'deal_expiring'),
        eq(notifications.shopId, deal.shopId),
        jsonTextEquals(notifications.metadata, 'dealId', deal.id),
        isToday(notifications.createdAt)
      ),
    });

    if (!existing) {
      await createNotification({
        userId: deal.shop.merchantId,
        shopId: deal.shopId,
        type: 'deal_expiring',
        title: 'ดีลใกล้หมดอายุ',
        message: `"${deal.title}" จะหมดอายุในอีก 24 ชั่วโมง`,
        metadata: { dealId: deal.id, dealTitle: deal.title },
      });
    }
  }
}

export async function checkMilestones(shopId: string): Promise<void> {
  void shopId;
}

export function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'เมื่อสักครู่';
  if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
  if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
  if (days < 7) return `${days} วันที่แล้ว`;
  return date.toLocaleDateString('th-TH');
}
