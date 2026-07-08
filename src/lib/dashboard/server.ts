// src/lib/dashboard/server.ts
// Dashboard-only server helpers. Keep merchant ownership checks here so pages
// and API routes do not re-invent user -> merchant -> shop lookup.

import { and, asc, desc, eq, gte } from 'drizzle-orm';
import { db } from '../db';
import { getMerchantFromUser, getMerchantShop } from '../auth';
import { getShopStats, getTopDeals } from '../../server/services/analytics.service';
import { getTierLimits, type Tier } from '../tiers';
import { deals, shops, analyticsEvents, menuItems, shopSpecialHours, type Deal, type Shop } from '../../../db/schema';
import { forbidden, notFound, unauthorized } from '../errors';

type DashboardUser = {
  id: string;
  name: string;
  email: string;
  role?: string | null;
};

export type DashboardContext = {
  user: DashboardUser;
  merchant: NonNullable<Awaited<ReturnType<typeof getMerchantFromUser>>>;
  shop: Shop | null;
};

export type DashboardShopContext = DashboardContext & {
  shop: Shop;
};

export function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
}

export async function getDashboardContext(user: DashboardUser | null | undefined): Promise<DashboardContext | null> {
  if (!user) return null;

  const merchant = await getMerchantFromUser(user.id);
  if (!merchant) return null;

  const shop = await getMerchantShop(merchant.id);
  return { user, merchant, shop };
}

export async function requireDashboardContext(user: DashboardUser | null | undefined): Promise<DashboardContext> {
  const context = await getDashboardContext(user);
  if (!context) {
    throw unauthorized('กรุณาเข้าสู่ระบบร้านค้าก่อนใช้งาน Dashboard');
  }
  return context;
}

export async function requireDashboardShop(user: DashboardUser | null | undefined): Promise<DashboardShopContext> {
  const context = await requireDashboardContext(user);
  if (!context.shop) {
    throw notFound('ยังไม่พบข้อมูลร้านค้า กรุณาสร้างร้านค้าก่อน');
  }
  return context as DashboardShopContext;
}

export async function assertShopOwnership(shopId: string, merchantId: string) {
  const shop = await db
    .select()
    .from(shops)
    .where(and(eq(shops.id, shopId), eq(shops.merchantId, merchantId)))
    .get();

  if (!shop) {
    throw forbidden('ไม่มีสิทธิ์จัดการร้านค้านี้');
  }

  return shop;
}

export async function getOwnedDeal(dealId: string, shopId: string) {
  const deal = await db
    .select()
    .from(deals)
    .where(and(eq(deals.id, dealId), eq(deals.shopId, shopId)))
    .get();

  if (!deal) {
    throw notFound('ไม่พบดีลนี้ในร้านของคุณ');
  }

  return deal;
}

export async function listDashboardDeals(shopId: string) {
  return db
    .select()
    .from(deals)
    .where(eq(deals.shopId, shopId))
    .orderBy(desc(deals.createdAt));
}

export async function listDashboardMenuItems(shopId: string) {
  return db
    .select()
    .from(menuItems)
    .where(eq(menuItems.shopId, shopId))
    .orderBy(asc(menuItems.sortOrder), asc(menuItems.createdAt));
}

export async function listDashboardSpecialHours(shopId: string) {
  return db
    .select()
    .from(shopSpecialHours)
    .where(eq(shopSpecialHours.shopId, shopId))
    .orderBy(asc(shopSpecialHours.date));
}

export async function getOwnedSpecialHour(itemId: string, shopId: string) {
  const item = await db
    .select()
    .from(shopSpecialHours)
    .where(and(eq(shopSpecialHours.id, itemId), eq(shopSpecialHours.shopId, shopId)))
    .get();

  if (!item) {
    throw notFound('ไม่พบเวลาพิเศษนี้ในร้านของคุณ');
  }

  return item;
}

export async function getOwnedMenuItem(itemId: string, shopId: string) {
  const item = await db
    .select()
    .from(menuItems)
    .where(and(eq(menuItems.id, itemId), eq(menuItems.shopId, shopId)))
    .get();

  if (!item) {
    throw notFound('ไม่พบเมนูนี้ในร้านของคุณ');
  }

  return item;
}

export function getDealState(deal: Pick<Deal, 'isActive' | 'startDate' | 'endDate'>) {
  const now = new Date();
  const startsAt = deal.startDate ? new Date(deal.startDate) : null;
  const endsAt = new Date(deal.endDate);

  if (!deal.isActive) return 'paused';
  if (startsAt && startsAt > now) return 'scheduled';
  if (endsAt < now) return 'expired';
  return 'active';
}

export function countActiveDeals(dealRows: Pick<Deal, 'isActive' | 'startDate' | 'endDate'>[]) {
  return dealRows.filter((deal) => getDealState(deal) === 'active').length;
}

export function getShopReadiness(shop: Shop | null, dealCount: number) {
  const checks = [
    {
      id: 'identity',
      label: 'ชื่อร้านและประเภทร้าน',
      done: Boolean(shop?.name && shop?.category),
      required: true,
      targetHref: '/dashboard/edit?section=identity',
      actionLabel: 'แก้ข้อมูลร้าน',
    },
    {
      id: 'story',
      label: 'คำอธิบายร้าน',
      done: Boolean(shop?.description),
      required: true,
      targetHref: '/dashboard/edit?section=identity',
      actionLabel: 'เติมคำอธิบาย',
    },
    {
      id: 'location',
      label: 'ที่อยู่และพิกัดแผนที่',
      done: Boolean(shop?.address && shop?.latitude && shop?.longitude),
      required: true,
      targetHref: '/dashboard/edit?section=location',
      actionLabel: 'เติมพิกัด',
    },
    {
      id: 'hours',
      label: 'เวลาเปิด-ปิด',
      done: Boolean(shop?.openingHours),
      required: true,
      targetHref: '/dashboard/edit?section=hours',
      actionLabel: 'เติมเวลา',
    },
    {
      id: 'contact',
      label: 'ช่องทางติดต่ออย่างน้อย 1 ช่องทาง',
      done: Boolean(shop?.phone || shop?.lineId || shop?.facebookUrl || shop?.instagramUrl || shop?.websiteUrl),
      required: true,
      targetHref: '/dashboard/edit?section=contact',
      actionLabel: 'เติมช่องทางติดต่อ',
    },
    {
      id: 'brand',
      label: 'รูปหน้าปกหรือโลโก้',
      done: Boolean(shop?.coverImage || shop?.logoImage),
      required: false,
      targetHref: '/dashboard/edit?section=brand',
      actionLabel: 'เพิ่มรูปภาพ',
    },
    {
      id: 'deals',
      label: 'มีดีลอย่างน้อย 1 รายการ',
      done: dealCount > 0,
      required: true,
      targetHref: '/dashboard/deals/new',
      actionLabel: 'สร้างดีล',
    },
  ];

  const doneCount = checks.filter((item) => item.done).length;
  const missingRequired = checks.filter((item) => item.required && !item.done);
  const score = Math.round((doneCount / checks.length) * 100);

  return {
    score,
    checks,
    missingRequired,
    status: missingRequired.length === 0 ? 'ready' : score >= 60 ? 'almost' : 'needs-work',
  };
}

export async function getDashboardOverview(shop: Shop) {
  const dealRows = await listDashboardDeals(shop.id);
  const activeDealCount = countActiveDeals(dealRows);
  const tier = (shop.tier as Tier) || 'free';
  const maxDeals = shop.maxActiveDeals ?? getTierLimits(tier).maxActiveDeals;
  const readiness = getShopReadiness(shop, dealRows.length);
  const { stats, totals } = await getShopStats(shop.id, 60);
  const topDeals = await getTopDeals(shop.id, 5);

  const upcomingDeals = dealRows
    .filter((deal) => getDealState(deal) === 'active')
    .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
    .slice(0, 4);

  return {
    deals: dealRows,
    activeDealCount,
    maxDeals,
    tier,
    readiness,
    stats,
    totals,
    topDeals,
    upcomingDeals,
  };
}

export async function deleteDealWithDashboardRelations(dealId: string) {
  await db.delete(analyticsEvents).where(eq(analyticsEvents.dealId, dealId));
  await db.delete(deals).where(eq(deals.id, dealId));
}

export async function hasReachedActiveDealLimit(shop: Shop) {
  const activeDeals = await db
    .select()
    .from(deals)
    .where(and(eq(deals.shopId, shop.id), eq(deals.isActive, true), gte(deals.endDate, new Date())));

  const maxDeals = shop.maxActiveDeals ?? getTierLimits((shop.tier as Tier) || 'free').maxActiveDeals;
  return {
    reached: activeDeals.length >= maxDeals,
    current: activeDeals.length,
    max: maxDeals,
  };
}
