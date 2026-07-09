import { createId } from '@paralleldrive/cuid2';
import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { analyticsEvents, dailyStats, deals } from '../../lib/db-schema';
import { db } from '../../lib/db';
import { firstRow } from '../../lib/db-query';
import { dayBucket } from '../../lib/db-sql';
import { badRequest } from '../../lib/errors';

export type EventType =
  | 'page_view'
  | 'deal_view'
  | 'deal_click'
  | 'deal_share'
  | 'contact_click'
  | 'map_pin_click'
  | 'map_directions_click'
  | 'map_filter_change';

const EVENT_TYPES = new Set<EventType>([
  'page_view',
  'deal_view',
  'deal_click',
  'deal_share',
  'contact_click',
  'map_pin_click',
  'map_directions_click',
  'map_filter_change',
]);

export type TrackEventInput = {
  type: EventType;
  shopId: string;
  dealId?: string;
  metadata?: Record<string, any>;
  ip?: string;
  userAgent?: string;
};

export function normalizeTrackEventInput(raw: any, request?: Request): TrackEventInput {
  if (!raw?.type || !raw?.shopId) {
    throw badRequest('VALIDATION_ERROR', 'กรุณาระบุ type และ shopId');
  }

  if (!EVENT_TYPES.has(raw.type)) {
    throw badRequest('VALIDATION_ERROR', 'ประเภท analytics event ไม่ถูกต้อง', { type: raw.type });
  }

  return {
    type: raw.type,
    shopId: String(raw.shopId),
    dealId: raw.dealId ? String(raw.dealId) : undefined,
    metadata: raw.metadata && typeof raw.metadata === 'object' ? raw.metadata : undefined,
    ip: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip') || undefined,
    userAgent: request?.headers.get('user-agent') || undefined,
  };
}

export async function trackEvent(params: TrackEventInput): Promise<void> {
  try {
    await db.insert(analyticsEvents).values({
      id: createId(),
      type: params.type,
      shopId: params.shopId,
      dealId: params.dealId || null,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      ip: params.ip || null,
      userAgent: params.userAgent || null,
    });
  } catch (error) {
    // Analytics must never break a public shop page or customer action.
    console.error('Analytics tracking error:', error);
  }
}

export async function trackEventFromRequest(rawData: unknown, request: Request) {
  await trackEvent(normalizeTrackEventInput(rawData, request));
}

export function normalizeAnalyticsDays(rawDays: string | null, fallback = 30) {
  const parsed = Number.parseInt(rawDays || String(fallback), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(365, Math.max(7, parsed));
}

export async function getShopStats(shopId: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString().split('T')[0];

  const aggregateRows = await db
    .select({
      date: dayBucket(analyticsEvents.createdAt),
      type: analyticsEvents.type,
      count: sql<number>`count(*)`,
      uniqueIps: sql<number>`count(distinct ${analyticsEvents.ip})`,
    })
    .from(analyticsEvents)
    .where(and(eq(analyticsEvents.shopId, shopId), gte(analyticsEvents.createdAt, startDate)))
    .groupBy(dayBucket(analyticsEvents.createdAt), analyticsEvents.type);

  const byDate = new Map<string, {
    shopId: string;
    date: string;
    pageViews: number;
    dealViews: number;
    dealClicks: number;
    shares: number;
    contactClicks: number;
    uniqueVisitors: number;
  }>();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const key = date.toISOString().split('T')[0];
    byDate.set(key, {
      shopId,
      date: key,
      pageViews: 0,
      dealViews: 0,
      dealClicks: 0,
      shares: 0,
      contactClicks: 0,
      uniqueVisitors: 0,
    });
  }

  for (const row of aggregateRows) {
    const day = byDate.get(row.date);
    if (!day) continue;

    const count = Number(row.count) || 0;
    const uniqueIps = Number(row.uniqueIps) || 0;

    if (row.type === 'page_view') day.pageViews += count;
    if (row.type === 'deal_view') day.dealViews += count;
    if (row.type === 'deal_click') day.dealClicks += count;
    if (row.type === 'deal_share') day.shares += count;
    if (row.type === 'contact_click') day.contactClicks += count;
    day.uniqueVisitors = Math.max(day.uniqueVisitors, uniqueIps);
  }

  const liveStats = Array.from(byDate.values());
  const hasLiveEvents = aggregateRows.length > 0;

  const storedStats = await db
    .select()
    .from(dailyStats)
    .where(and(eq(dailyStats.shopId, shopId), gte(dailyStats.date, startDateStr)))
    .orderBy(dailyStats.date);

  const stats = hasLiveEvents ? liveStats : storedStats;
  const source = hasLiveEvents ? 'analytics_events' : 'daily_stats';

  const totals = stats.reduce(
    (acc, day) => ({
      pageViews: acc.pageViews + (day.pageViews || 0),
      dealViews: acc.dealViews + (day.dealViews || 0),
      dealClicks: acc.dealClicks + (day.dealClicks || 0),
      shares: acc.shares + (day.shares || 0),
      contactClicks: acc.contactClicks + (day.contactClicks || 0),
    }),
    { pageViews: 0, dealViews: 0, dealClicks: 0, shares: 0, contactClicks: 0 }
  );

  return { stats, totals, source };
}

export async function getTopDeals(shopId: string, limit: number = 5) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return db
    .select({
      dealId: analyticsEvents.dealId,
      title: deals.title,
      category: deals.category,
      views: sql<number>`sum(case when ${analyticsEvents.type} = 'deal_view' then 1 else 0 end)`,
      clicks: sql<number>`sum(case when ${analyticsEvents.type} = 'deal_click' then 1 else 0 end)`,
      shares: sql<number>`sum(case when ${analyticsEvents.type} = 'deal_share' then 1 else 0 end)`,
    })
    .from(analyticsEvents)
    .leftJoin(deals, eq(analyticsEvents.dealId, deals.id))
    .where(
      and(
        eq(analyticsEvents.shopId, shopId),
        sql`${analyticsEvents.dealId} IS NOT NULL`,
        gte(analyticsEvents.createdAt, thirtyDaysAgo)
      )
    )
    .groupBy(analyticsEvents.dealId, deals.title, deals.category)
    .orderBy(desc(sql<number>`sum(case when ${analyticsEvents.type} = 'deal_view' then 1 else 0 end)`))
    .limit(limit);
}

export async function getDealViewCount(dealId: string): Promise<number> {
  const result = await firstRow(db
    .select({ views: sql<number>`count(*)` })
    .from(analyticsEvents)
    .where(and(eq(analyticsEvents.dealId, dealId), eq(analyticsEvents.type, 'deal_view')))
    .limit(1));

  return result?.views || 0;
}

export async function aggregateDailyStats(shopId: string, date: string): Promise<void> {
  const startOfDay = new Date(date + 'T00:00:00');
  const endOfDay = new Date(date + 'T23:59:59');

  const result = await db
    .select({
      type: analyticsEvents.type,
      count: sql<number>`count(*)`,
      uniqueIps: sql<number>`count(distinct ${analyticsEvents.ip})`,
    })
    .from(analyticsEvents)
    .where(
      and(
        eq(analyticsEvents.shopId, shopId),
        gte(analyticsEvents.createdAt, startOfDay),
        lte(analyticsEvents.createdAt, endOfDay)
      )
    )
    .groupBy(analyticsEvents.type);

  const stats: Record<string, { count: number; uniqueIps: number }> = {};
  result.forEach((row) => {
    stats[row.type] = { count: row.count, uniqueIps: row.uniqueIps };
  });

  const existing = await firstRow(db
    .select()
    .from(dailyStats)
    .where(and(eq(dailyStats.shopId, shopId), eq(dailyStats.date, date)))
    .limit(1));

  const data = {
    pageViews: stats.page_view?.count || 0,
    dealViews: stats.deal_view?.count || 0,
    dealClicks: stats.deal_click?.count || 0,
    shares: stats.deal_share?.count || 0,
    contactClicks: stats.contact_click?.count || 0,
    uniqueVisitors: Math.max(stats.page_view?.uniqueIps || 0, stats.deal_view?.uniqueIps || 0),
  };

  if (existing) {
    await db.update(dailyStats).set(data).where(eq(dailyStats.id, existing.id));
    return;
  }

  await db.insert(dailyStats).values({
    id: createId(),
    shopId,
    date,
    ...data,
  });
}

export async function getDashboardAnalytics(shopId: string, days: number) {
  const { stats, totals, source } = await getShopStats(shopId, days);
  const topDeals = await getTopDeals(shopId, 5);
  return { stats, totals, topDeals, source };
}
