// src/lib/notifications.ts

import { db } from './db';
import { notifications, shops, deals } from '../../db/schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

// ─── Notification Types ──────────────────────────────────

export type NotificationType = 'deal_expiring' | 'deal_expired' | 'milestone' | 'system';

// ─── Create Notification ─────────────────────────────────

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

// ─── Get Notifications ───────────────────────────────────

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

// ─── Get Unread Count ────────────────────────────────────

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

// ─── Mark as Read ────────────────────────────────────────

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

// ─── Check Deal Expiration ───────────────────────────────

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
    if (!deal.shop) continue;

    // Check if notification already sent today
    const existing = await db.query.notifications.findFirst({
      where: and(
        eq(notifications.type, 'deal_expiring'),
        eq(notifications.shopId, deal.shopId),
        sql`json_extract(${notifications.metadata}, '$.dealId') = ${deal.id}`,
        sql`date(${notifications.createdAt}) = date('now')`
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

// ─── Check Milestones ────────────────────────────────────

export async function checkMilestones(shopId: string): Promise<void> {
  // This would check for milestones like 100 views, 10 shares, etc.
  // For now, it's a placeholder
}

// ─── Format Time Ago ─────────────────────────────────────

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
