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
  | 'claim_started'
  | 'coupon_copied'
  | 'contact_started'
  | 'redemption_confirmed'
  | 'deal_share'
  | 'contact_click'
  | 'map_pin_click'
  | 'map_directions_click'
  | 'map_filter_change';

const EVENT_TYPES = new Set<EventType>([
  'page_view',
  'deal_view',
  'deal_click',
  'claim_started',
  'coupon_copied',
  'contact_started',
  'redemption_confirmed',
  'deal_share',
  'contact_click',
  'map_pin_click',
  'map_directions_click',
  'map_filter_change',
]);
const EVENT_DEDUPE_WINDOW_MS = 2_000;
const recentEventKeys = new Map<string, number>();

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
    metadata: raw.metadata && typeof raw.metadata === 'object'
      ? Object.fromEntries(
          Object.entries(raw.metadata)
            .slice(0, 16)
            .filter(([, value]) => ['string', 'number', 'boolean'].includes(typeof value))
            .map(([key, value]) => [String(key).slice(0, 64), typeof value === 'string' ? value.slice(0, 240) : value])
        )
      : undefined,
    ip: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip') || undefined,
    userAgent: request?.headers.get('user-agent') || undefined,
  };
}

export async function trackEvent(params: TrackEventInput): Promise<void> {
  try {
    const now = Date.now();
    const dedupeKey = `${params.ip || 'anonymous'}:${params.userAgent || 'unknown'}:${params.type}:${params.shopId}:${params.dealId || ''}`;
    const lastSeenAt = recentEventKeys.get(dedupeKey) || 0;
    if (now - lastSeenAt < EVENT_DEDUPE_WINDOW_MS) return;
    recentEventKeys.set(dedupeKey, now);
    if (recentEventKeys.size > 5_000) {
      for (const [key, seenAt] of recentEventKeys) {
        if (now - seenAt > EVENT_DEDUPE_WINDOW_MS) recentEventKeys.delete(key);
      }
    }

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
    claimStarts: number;
    couponCopies: number;
    contactStarts: number;
    redemptions: number;
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
      claimStarts: 0,
      couponCopies: 0,
      contactStarts: 0,
      redemptions: 0,
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
    if (row.type === 'claim_started') day.claimStarts += count;
    if (row.type === 'coupon_copied') day.couponCopies += count;
    if (row.type === 'contact_started') day.contactStarts += count;
    if (row.type === 'redemption_confirmed') day.redemptions += count;
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

  const normalizedStoredStats = storedStats.map((day) => ({
    ...day,
    claimStarts: 0,
    couponCopies: 0,
    contactStarts: 0,
    redemptions: 0,
  }));
  const stats = hasLiveEvents ? liveStats : normalizedStoredStats;
  const source = hasLiveEvents ? 'analytics_events' : 'daily_stats';

  const totals = stats.reduce(
    (acc, day) => ({
      pageViews: acc.pageViews + (day.pageViews || 0),
      dealViews: acc.dealViews + (day.dealViews || 0),
      dealClicks: acc.dealClicks + (day.dealClicks || 0),
      claimStarts: acc.claimStarts + (day.claimStarts || 0),
      couponCopies: acc.couponCopies + (day.couponCopies || 0),
      contactStarts: acc.contactStarts + (day.contactStarts || 0),
      redemptions: acc.redemptions + (day.redemptions || 0),
      shares: acc.shares + (day.shares || 0),
      contactClicks: acc.contactClicks + (day.contactClicks || 0),
    }),
    { pageViews: 0, dealViews: 0, dealClicks: 0, claimStarts: 0, couponCopies: 0, contactStarts: 0, redemptions: 0, shares: 0, contactClicks: 0 }
  );

  return { stats, totals, source };
}

export async function getTopDeals(shopId: string, limit: number = 5, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return db
    .select({
      dealId: analyticsEvents.dealId,
      title: deals.title,
      category: deals.category,
      views: sql<number>`sum(case when ${analyticsEvents.type} = 'deal_view' then 1 else 0 end)`,
      clicks: sql<number>`sum(case when ${analyticsEvents.type} = 'deal_click' then 1 else 0 end)`,
      redemptions: sql<number>`sum(case when ${analyticsEvents.type} = 'redemption_confirmed' then 1 else 0 end)`,
      shares: sql<number>`sum(case when ${analyticsEvents.type} = 'deal_share' then 1 else 0 end)`,
    })
    .from(analyticsEvents)
    .leftJoin(deals, eq(analyticsEvents.dealId, deals.id))
    .where(
      and(
        eq(analyticsEvents.shopId, shopId),
        sql`${analyticsEvents.dealId} IS NOT NULL`,
        gte(analyticsEvents.createdAt, startDate)
      )
    )
    .groupBy(analyticsEvents.dealId, deals.title, deals.category)
    .orderBy(desc(sql<number>`sum(case when ${analyticsEvents.type} = 'deal_view' then 1 else 0 end)`))
    .limit(limit);
}

type DealQuotaSource = {
  dealId: string;
  title: string;
  maxRedemptions: number | null;
  lowStockThreshold: number | null;
  redemptions: number | null;
};

export type DealQuotaStat = {
  dealId: string;
  title: string;
  maxRedemptions: number | null;
  redemptions: number;
  remaining: number | null;
  fillRate: number | null;
  status: 'unlimited' | 'available' | 'low_stock' | 'exhausted';
};

export type DealQuotaSummary = {
  limitedDealCount: number;
  unlimitedDealCount: number;
  limitedCapacity: number;
  redeemedCapacity: number;
  remainingCapacity: number;
  fillRate: number | null;
  lowStockDealCount: number;
  exhaustedDealCount: number;
};

export function normalizeDealQuotaAnalytics(rows: DealQuotaSource[]) {
  const deals: DealQuotaStat[] = rows.map((row) => {
    const redemptions = Number(row.redemptions) || 0;
    const maxRedemptions = row.maxRedemptions === null ? null : Number(row.maxRedemptions);

    if (maxRedemptions === null) {
      return {
        dealId: row.dealId,
        title: row.title,
        maxRedemptions: null,
        redemptions,
        remaining: null,
        fillRate: null,
        status: 'unlimited' as const,
      };
    }

    const remaining = Math.max(0, maxRedemptions - redemptions);
    const fillRate = Math.min(100, Math.round((redemptions / maxRedemptions) * 100));
    const lowStockThreshold = Math.max(1, Number(row.lowStockThreshold) || 10);
    const status = remaining === 0
      ? 'exhausted' as const
      : remaining <= lowStockThreshold
        ? 'low_stock' as const
        : 'available' as const;

    return {
      dealId: row.dealId,
      title: row.title,
      maxRedemptions,
      redemptions,
      remaining,
      fillRate,
      status,
    };
  });

  const limitedDeals = deals.filter((deal) => deal.maxRedemptions !== null);
  const limitedCapacity = limitedDeals.reduce((total, deal) => total + (deal.maxRedemptions || 0), 0);
  const redeemedCapacity = limitedDeals.reduce((total, deal) => total + Math.min(deal.redemptions, deal.maxRedemptions || 0), 0);

  const summary: DealQuotaSummary = {
    limitedDealCount: limitedDeals.length,
    unlimitedDealCount: deals.length - limitedDeals.length,
    limitedCapacity,
    redeemedCapacity,
    remainingCapacity: Math.max(0, limitedCapacity - redeemedCapacity),
    fillRate: limitedCapacity > 0 ? Math.round((redeemedCapacity / limitedCapacity) * 100) : null,
    lowStockDealCount: limitedDeals.filter((deal) => deal.status === 'low_stock').length,
    exhaustedDealCount: limitedDeals.filter((deal) => deal.status === 'exhausted').length,
  };

  return { deals, summary };
}

export async function getDealQuotaAnalytics(shopId: string) {
  const rows = await db
    .select({
      dealId: deals.id,
      title: deals.title,
      maxRedemptions: deals.maxRedemptions,
      lowStockThreshold: deals.lowStockThreshold,
      redemptions: sql<number>`sum(case when ${analyticsEvents.type} = 'redemption_confirmed' then 1 else 0 end)`,
    })
    .from(deals)
    .leftJoin(analyticsEvents, eq(analyticsEvents.dealId, deals.id))
    .where(eq(deals.shopId, shopId))
    .groupBy(deals.id, deals.title, deals.maxRedemptions, deals.lowStockThreshold);

  return normalizeDealQuotaAnalytics(rows);
}

export async function getPreviousPeriodTotals(shopId: string, days: number) {
  const endDate = new Date();
  endDate.setDate(endDate.getDate() - days);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days * 2);

  const rows = await db
    .select({
      type: analyticsEvents.type,
      count: sql<number>`count(*)`,
    })
    .from(analyticsEvents)
    .where(
      and(
        eq(analyticsEvents.shopId, shopId),
        gte(analyticsEvents.createdAt, startDate),
        lte(analyticsEvents.createdAt, endDate)
      )
    )
    .groupBy(analyticsEvents.type);

  const totals = { pageViews: 0, dealViews: 0, dealClicks: 0, claimStarts: 0, couponCopies: 0, contactStarts: 0, redemptions: 0, shares: 0, contactClicks: 0 };
  rows.forEach((row) => {
    const count = Number(row.count) || 0;
    if (row.type === 'page_view') totals.pageViews += count;
    if (row.type === 'deal_view') totals.dealViews += count;
    if (row.type === 'deal_click') totals.dealClicks += count;
    if (row.type === 'claim_started') totals.claimStarts += count;
    if (row.type === 'coupon_copied') totals.couponCopies += count;
    if (row.type === 'contact_started') totals.contactStarts += count;
    if (row.type === 'redemption_confirmed') totals.redemptions += count;
    if (row.type === 'deal_share') totals.shares += count;
    if (row.type === 'contact_click') totals.contactClicks += count;
  });
  return totals;
}

export async function getCategoryBreakdown(shopId: string, days: number) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const rows = await db
    .select({
      category: deals.category,
      views: sql<number>`sum(case when ${analyticsEvents.type} = 'deal_view' then 1 else 0 end)`,
      clicks: sql<number>`sum(case when ${analyticsEvents.type} = 'deal_click' then 1 else 0 end)`,
    })
    .from(analyticsEvents)
    .leftJoin(deals, eq(analyticsEvents.dealId, deals.id))
    .where(
      and(
        eq(analyticsEvents.shopId, shopId),
        sql`${analyticsEvents.dealId} IS NOT NULL`,
        gte(analyticsEvents.createdAt, startDate)
      )
    )
    .groupBy(deals.category);

  return rows
    .filter((row) => row.category)
    .map((row) => ({
      category: row.category as string,
      views: Number(row.views) || 0,
      clicks: Number(row.clicks) || 0,
    }))
    .sort((a, b) => b.views - a.views);
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
  const [topDeals, previousTotals, categoryBreakdown, quota] = await Promise.all([
    getTopDeals(shopId, 5, days),
    getPreviousPeriodTotals(shopId, days),
    getCategoryBreakdown(shopId, days),
    getDealQuotaAnalytics(shopId),
  ]);
  return { stats, totals, topDeals, source, previousTotals, categoryBreakdown, quota };
}
