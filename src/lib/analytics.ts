// src/lib/analytics.ts

import { db } from './db';
import { analyticsEvents, dailyStats } from '../../db/schema';
import { eq, and, gte, lte, sql, desc } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

// ─── Event Types ─────────────────────────────────────────

export type EventType =
  | 'page_view'
  | 'deal_view'
  | 'deal_click'
  | 'deal_share'
  | 'contact_click'
  | 'map_pin_click'
  | 'map_directions_click'
  | 'map_filter_change';

// ─── Track Event ─────────────────────────────────────────

export async function trackEvent(params: {
  type: EventType;
  shopId: string;
  dealId?: string;
  metadata?: Record<string, any>;
  ip?: string;
  userAgent?: string;
}): Promise<void> {
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
    // Don't let analytics errors break the app
    console.error('Analytics tracking error:', error);
  }
}

// ─── Get Shop Stats ──────────────────────────────────────

export async function getShopStats(shopId: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString().split('T')[0];

  // Get daily stats
  const stats = await db
    .select()
    .from(dailyStats)
    .where(
      and(
        eq(dailyStats.shopId, shopId),
        gte(dailyStats.date, startDateStr)
      )
    )
    .orderBy(dailyStats.date);

  // Calculate totals
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

  return { stats, totals };
}

// ─── Get Top Deals ───────────────────────────────────────

import { deals } from '../../db/schema';

export async function getTopDeals(shopId: string, limit: number = 5) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const result = await db
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

  return result;
}

// ─── Aggregate Daily Stats ───────────────────────────────

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
  result.forEach(row => {
    stats[row.type] = { count: row.count, uniqueIps: row.uniqueIps };
  });

  // Upsert daily stats
  const existing = await db
    .select()
    .from(dailyStats)
    .where(and(eq(dailyStats.shopId, shopId), eq(dailyStats.date, date)))
    .get();

  const data = {
    pageViews: stats['page_view']?.count || 0,
    dealViews: stats['deal_view']?.count || 0,
    dealClicks: stats['deal_click']?.count || 0,
    shares: stats['deal_share']?.count || 0,
    contactClicks: stats['contact_click']?.count || 0,
    uniqueVisitors: Math.max(
      stats['page_view']?.uniqueIps || 0,
      stats['deal_view']?.uniqueIps || 0
    ),
  };

  if (existing) {
    await db
      .update(dailyStats)
      .set(data)
      .where(eq(dailyStats.id, existing.id));
  } else {
    await db.insert(dailyStats).values({
      id: createId(),
      shopId,
      date,
      ...data,
    });
  }
}
