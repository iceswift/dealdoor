import { createId } from '@paralleldrive/cuid2';
import { and, desc, eq, gte, lt, lte, or, sql } from 'drizzle-orm';
import { analyticsEvents, deals, merchants, notificationPreferences, notifications, shops } from '../../lib/db-schema';
import { db } from '../../lib/db';
import { forbidden, notFound } from '../../lib/errors';
import { isToday, jsonTextEquals } from '../../lib/db-sql';
import { runExclusiveJob } from './job.service';
import { recordInAppDelivery } from './notification-outbox.service';

export type NotificationType =
  | 'deal_expiring'
  | 'deal_expired'
  | 'milestone'
  | 'report_created'
  | 'report_resolved'
  | 'system';

export type NotificationScope = {
  userId: string;
  shopId?: string;
};

export type NotificationPreferenceInput = {
  inAppEnabled: boolean;
  dealUpdates: boolean;
  milestones: boolean;
  reports: boolean;
  systemUpdates: boolean;
};

const defaultPreferences: NotificationPreferenceInput = {
  inAppEnabled: true,
  dealUpdates: true,
  milestones: true,
  reports: true,
  systemUpdates: true,
};

function preferenceKeyFor(type: NotificationType): keyof NotificationPreferenceInput {
  if (type === 'deal_expiring' || type === 'deal_expired') return 'dealUpdates';
  if (type === 'milestone') return 'milestones';
  if (type === 'report_created' || type === 'report_resolved') return 'reports';
  return 'systemUpdates';
}

export async function getNotificationPreferences(userId: string): Promise<NotificationPreferenceInput> {
  const preferences = await db.query.notificationPreferences.findFirst({
    where: eq(notificationPreferences.userId, userId),
  });
  if (!preferences) return defaultPreferences;

  return {
    inAppEnabled: preferences.inAppEnabled ?? true,
    dealUpdates: preferences.dealUpdates ?? true,
    milestones: preferences.milestones ?? true,
    reports: preferences.reports ?? true,
    systemUpdates: preferences.systemUpdates ?? true,
  };
}

export async function updateNotificationPreferences(userId: string, rawData: unknown) {
  const data = rawData as Partial<NotificationPreferenceInput>;
  const values = Object.fromEntries(
    Object.entries(data).filter(([key, value]) => key in defaultPreferences && typeof value === 'boolean'),
  ) as Partial<NotificationPreferenceInput>;

  const existing = await db.query.notificationPreferences.findFirst({
    where: eq(notificationPreferences.userId, userId),
  });
  const next = { ...(existing ? await getNotificationPreferences(userId) : defaultPreferences), ...values };

  if (existing) {
    await db.update(notificationPreferences)
      .set({ ...next, updatedAt: new Date() })
      .where(eq(notificationPreferences.userId, userId));
  } else {
    await db.insert(notificationPreferences).values({ userId, ...next, updatedAt: new Date() });
  }

  return next;
}

export async function createNotification(params: {
  userId?: string;
  shopId?: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}): Promise<string | null> {
  if (params.userId) {
    const preferences = await getNotificationPreferences(params.userId);
    if (!preferences.inAppEnabled || !preferences[preferenceKeyFor(params.type)]) return null;
  }

  const id = createId();

  await db.transaction(async (transaction) => {
    await transaction.insert(notifications).values({
      id,
      userId: params.userId,
      shopId: params.shopId || null,
      type: params.type,
      title: params.title,
      message: params.message,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
    });
    await recordInAppDelivery(id, transaction as typeof db);
  });

  return id;
}

export async function createShopNotification(params: {
  shopId: string;
  merchantId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}): Promise<string | null> {
  const merchant = await db.query.merchants.findFirst({
    where: eq(merchants.id, params.merchantId),
  });

  // A shop without a linked account is sample/imported data. It has nobody who
  // can receive dashboard notifications yet, so skip it instead of failing a scan.
  if (!merchant?.userId) return null;

  return createNotification({
    ...params,
    userId: merchant.userId,
  });
}

function scopeCondition(scope: NotificationScope) {
  return scope.shopId
    ? or(eq(notifications.userId, scope.userId), eq(notifications.shopId, scope.shopId))
    : eq(notifications.userId, scope.userId);
}

export function normalizeNotificationListParams(url: URL) {
  return {
    limit: Math.min(50, Math.max(1, Number.parseInt(url.searchParams.get('limit') || '20', 10) || 20)),
    unreadOnly: url.searchParams.get('unread') === 'true',
  };
}

export async function getNotifications(scope: NotificationScope, params: {
  limit?: number;
  unreadOnly?: boolean;
}) {
  const conditions = [scopeCondition(scope)];
  if (params.unreadOnly) conditions.push(eq(notifications.read, false));

  return db.query.notifications.findMany({
    where: and(...conditions),
    orderBy: [desc(notifications.createdAt)],
    limit: params.limit || 20,
  });
}

export async function getUnreadCount(scope: NotificationScope): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(and(scopeCondition(scope), eq(notifications.read, false)));

  return result?.count || 0;
}

export async function getNotificationInbox(url: URL, scope: NotificationScope) {
  const params = normalizeNotificationListParams(url);
  const [notificationsList, unreadCount] = await Promise.all([
    getNotifications(scope, params),
    getUnreadCount(scope),
  ]);

  return { notifications: notificationsList, unreadCount };
}

export async function markAsRead(notificationId: string, scope: NotificationScope): Promise<void> {
  const notification = await db.query.notifications.findFirst({
    where: and(eq(notifications.id, notificationId), scopeCondition(scope)),
  });

  if (!notification) throw notFound('ไม่พบการแจ้งเตือน');

  await db.update(notifications)
    .set({ read: true, readAt: new Date() })
    .where(eq(notifications.id, notificationId));
}

export async function markAllAsRead(scope: NotificationScope): Promise<void> {
  await db.update(notifications)
    .set({ read: true, readAt: new Date() })
    .where(and(scopeCondition(scope), eq(notifications.read, false)));
}

export async function markNotificationRead(notificationId: string | undefined, scope: NotificationScope) {
  if (notificationId === 'all') return markAllAsRead(scope);
  if (!notificationId) throw forbidden('ไม่สามารถจัดการการแจ้งเตือนได้');
  return markAsRead(notificationId, scope);
}

export async function checkDealExpiration(): Promise<void> {
  const now = new Date();
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const expiringDeals = await db.query.deals.findMany({
    where: and(eq(deals.isActive, true), gte(deals.endDate, now), lte(deals.endDate, in24Hours)),
    with: { shop: true },
  });

  for (const deal of expiringDeals) {
    if (!deal.shop) continue;

    const existing = await db.query.notifications.findFirst({
      where: and(
        eq(notifications.type, 'deal_expiring'),
        eq(notifications.shopId, deal.shopId),
        jsonTextEquals(notifications.metadata, 'dealId', deal.id),
        isToday(notifications.createdAt),
      ),
    });

    if (!existing) {
      await createShopNotification({
        merchantId: deal.shop.merchantId,
        shopId: deal.shopId,
        type: 'deal_expiring',
        title: 'ดีลใกล้หมดอายุ',
        message: `"${deal.title}" จะหมดอายุภายใน 24 ชั่วโมง`,
        metadata: { dealId: deal.id, href: `/dashboard/deals/edit?id=${deal.id}` },
      });
    }
  }
}

async function hasNotificationEvent(shopId: string, eventKey: string) {
  return db.query.notifications.findFirst({
    where: and(
      eq(notifications.shopId, shopId),
      jsonTextEquals(notifications.metadata, 'eventKey', eventKey),
    ),
  });
}

export async function checkExpiredDeals(): Promise<void> {
  const expiredDeals = await db.query.deals.findMany({
    where: and(eq(deals.isActive, true), lt(deals.endDate, new Date())),
    with: { shop: true },
  });

  for (const deal of expiredDeals) {
    if (!deal.shop) continue;
    const eventKey = `deal-expired:${deal.id}`;
    if (await hasNotificationEvent(deal.shopId, eventKey)) continue;

    await createShopNotification({
      merchantId: deal.shop.merchantId,
      shopId: deal.shopId,
      type: 'deal_expired',
      title: 'ดีลหมดอายุแล้ว',
      message: `"${deal.title}" หมดอายุแล้ว เลือกต่ออายุหรือสร้างดีลใหม่ได้เลย`,
      metadata: { dealId: deal.id, eventKey, href: `/dashboard/deals/edit?id=${deal.id}` },
    });
  }
}

function getSetupScore(shop: Awaited<ReturnType<typeof db.query.shops.findMany>>[number], dealCount: number) {
  const fields = [
    Boolean(shop.name && shop.category),
    Boolean(shop.description),
    Boolean(shop.address && shop.latitude && shop.longitude),
    Boolean(shop.openingHours),
    Boolean(shop.phone || shop.lineId || shop.facebookUrl || shop.instagramUrl || shop.websiteUrl),
    Boolean(shop.coverImage || shop.logoImage),
    dealCount > 0,
  ];
  return Math.round((fields.filter(Boolean).length / fields.length) * 100);
}

export async function checkShopReadiness(): Promise<void> {
  const shopRows = await db.query.shops.findMany();

  for (const shop of shopRows) {
    const [dealCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(deals)
      .where(eq(deals.shopId, shop.id));
    const score = getSetupScore(shop, Number(dealCount?.count || 0));
    if (score >= 100) continue;

    const eventKey = 'shop-setup-incomplete';
    if (await hasNotificationEvent(shop.id, eventKey)) continue;

    await createShopNotification({
      merchantId: shop.merchantId,
      shopId: shop.id,
      type: 'system',
      title: 'เติมข้อมูลร้านให้พร้อมสำหรับ Explore',
      message: `ข้อมูลหน้าร้านของคุณพร้อมแล้ว ${score}% เติมให้ครบเพื่อช่วยให้ลูกค้าค้นหาร้านเจอได้ง่ายขึ้น`,
      metadata: { eventKey, readinessScore: score, href: '/dashboard/edit' },
    });
  }
}

export async function checkAnalyticsMilestones(): Promise<void> {
  const thresholds = [100, 500, 1_000, 5_000, 10_000];
  const shopRows = await db.query.shops.findMany();

  for (const shop of shopRows) {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(analyticsEvents)
      .where(and(eq(analyticsEvents.shopId, shop.id), eq(analyticsEvents.type, 'page_view')));
    const views = Number(result?.count || 0);
    const threshold = [...thresholds].reverse().find((value) => views >= value);
    if (!threshold) continue;

    const eventKey = `page-view-milestone:${threshold}`;
    if (await hasNotificationEvent(shop.id, eventKey)) continue;

    await createShopNotification({
      merchantId: shop.merchantId,
      shopId: shop.id,
      type: 'milestone',
      title: 'ร้านของคุณมีคนเข้าชมเพิ่มขึ้น',
      message: `ยินดีด้วย หน้าร้านมียอดเข้าชมครบ ${threshold.toLocaleString('th-TH')} ครั้งแล้ว`,
      metadata: { eventKey, views, href: '/dashboard/analytics' },
    });
  }
}

export async function runNotificationScan() {
  await checkDealExpiration();
  await checkExpiredDeals();
  await checkShopReadiness();
  await checkAnalyticsMilestones();
  return { completedAt: new Date().toISOString() };
}

export function executeNotificationScan() {
  return runExclusiveJob('notifications.scan', runNotificationScan);
}
