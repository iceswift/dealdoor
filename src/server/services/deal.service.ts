import { createId } from '@paralleldrive/cuid2';
import { and, eq, sql } from 'drizzle-orm';
import { analyticsEvents, deals, type Shop } from '../../lib/db-schema';
import { badRequest, unprocessable } from '../../lib/errors';
import { db } from '../../lib/db';
import { runTransaction, transactionRows, transactionWrite } from '../../lib/db-transaction';
import { isPostgresRuntime } from '../../lib/db-runtime';
import { firstRow } from '../../lib/db-query';
import { notifyDealQuotaStatus } from './notification.service';
import { dealSchema, validateInput } from '../../lib/validations';
import {
  deleteDealWithDashboardRelations,
  getOwnedDeal,
  hasReachedActiveDealLimit,
  listDashboardDeals,
} from '../../lib/dashboard/server';

export async function listDealsForShop(shopId: string) {
  return listDashboardDeals(shopId);
}

export async function getDealForShop(dealId: string, shopId: string) {
  return getOwnedDeal(dealId, shopId);
}

export async function createDealForShop(shop: Shop, rawData: unknown) {
  const validation = validateInput(dealSchema, rawData);
  if (!validation.success) {
    throw badRequest('VALIDATION_ERROR', 'ข้อมูลดีลไม่ถูกต้อง', validation.errors);
  }

  const limit = await hasReachedActiveDealLimit(shop);
  if (limit.reached) {
    throw unprocessable('DEAL_LIMIT_REACHED', `แพ็กเกจของคุณเปิดดีลพร้อมกันได้สูงสุด ${limit.max} ดีล`, {
      current: limit.current,
      max: limit.max,
      tier: shop.tier,
    });
  }

  const data = validation.data!;
  const dealId = createId();

  await db.insert(deals).values({
    id: dealId,
    shopId: shop.id,
    title: data.title,
    category: data.category,
    description: data.description || null,
    shortDescription: data.shortDescription || null,
    discountText: data.discountText,
    conditions: data.conditions || null,
    couponCode: data.couponCode || null,
    claimType: data.claimType,
    imageUrl: data.imageUrl || null,
    startDate: data.startDate ? new Date(data.startDate) : null,
    endDate: new Date(data.endDate),
    maxRedemptions: data.maxRedemptions ?? null,
    redemptionAvailabilityDisplay: data.redemptionAvailabilityDisplay || 'low_stock',
    lowStockThreshold: data.lowStockThreshold || 10,
    isActive: true,
  });

  return getDealForShop(dealId, shop.id);
}

export async function updateDealForShop(dealId: string, shopId: string, rawData: unknown) {
  const existing = await getDealForShop(dealId, shopId);
  const validation = validateInput(dealSchema, rawData);

  if (!validation.success) {
    throw badRequest('VALIDATION_ERROR', 'ข้อมูลดีลไม่ถูกต้อง', validation.errors);
  }

  const data = validation.data!;

  await db
    .update(deals)
    .set({
      title: data.title,
      category: data.category,
      description: data.description || null,
      shortDescription: data.shortDescription || null,
      discountText: data.discountText,
      conditions: data.conditions || null,
      couponCode: data.couponCode || null,
      claimType: data.claimType,
      imageUrl: data.imageUrl || null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: new Date(data.endDate),
      maxRedemptions: data.maxRedemptions ?? null,
      redemptionAvailabilityDisplay: data.redemptionAvailabilityDisplay || existing.redemptionAvailabilityDisplay,
      lowStockThreshold: data.lowStockThreshold || existing.lowStockThreshold,
      isActive: existing.isActive,
      updatedAt: new Date(),
    })
    .where(eq(deals.id, dealId));

  return getDealForShop(dealId, shopId);
}

export async function setDealActiveForShop(dealId: string, shopId: string, rawData: unknown) {
  await getDealForShop(dealId, shopId);
  const data = rawData as { isActive?: unknown };

  if (typeof data?.isActive !== 'boolean') {
    throw badRequest('VALIDATION_ERROR', 'สถานะดีลไม่ถูกต้อง');
  }

  await db
    .update(deals)
    .set({
      isActive: data.isActive,
      updatedAt: new Date(),
    })
    .where(eq(deals.id, dealId));
}

export async function deleteDealForShop(dealId: string, shopId: string) {
  await getDealForShop(dealId, shopId);
  await deleteDealWithDashboardRelations(dealId);
}

export async function getDealRedemptionCount(dealId: string) {
  const row = await firstRow(db
    .select({ count: sql<number>`count(*)` })
    .from(analyticsEvents)
    .where(and(eq(analyticsEvents.dealId, dealId), eq(analyticsEvents.type, 'redemption_confirmed')))
    .limit(1));

  return Number(row?.count || 0);
}

export async function confirmDealRedemptionForShop(dealId: string, shopId: string, metadata: { ip?: string; userAgent?: string }) {
  const deal = await getDealForShop(dealId, shopId);

  const summary = await runTransaction(db, function* (tx): Generator<any, any, any> {
    const [row] = yield transactionRows(tx
      .select({ count: sql<number>`count(*)` })
      .from(analyticsEvents)
      .where(and(eq(analyticsEvents.dealId, deal.id), eq(analyticsEvents.type, 'redemption_confirmed')))
      .limit(1));
    const current = Number(row?.count || 0);

    if (deal.maxRedemptions !== null && current >= deal.maxRedemptions) {
      throw unprocessable('REDEMPTION_LIMIT_REACHED', 'ดีลนี้ใช้สิทธิ์ครบตามจำนวนที่กำหนดแล้ว', {
        current,
        max: deal.maxRedemptions,
      });
    }

    yield transactionWrite(tx.insert(analyticsEvents).values({
      id: createId(),
      type: 'redemption_confirmed',
      shopId,
      dealId: deal.id,
      metadata: JSON.stringify({ source: 'merchant_dashboard' }),
      ip: metadata.ip || null,
      userAgent: metadata.userAgent || null,
      createdAt: new Date(),
    }));

    return {
      redemptions: current + 1,
      maxRedemptions: deal.maxRedemptions,
    };
  }, isPostgresRuntime());

  try {
    await notifyDealQuotaStatus({
      dealId: deal.id,
      shopId,
      title: deal.title,
      maxRedemptions: deal.maxRedemptions,
      lowStockThreshold: deal.lowStockThreshold,
      redemptions: summary.redemptions,
    });
  } catch (error) {
    // A confirmed redemption must not be rolled back in the user experience if alert delivery fails.
    console.error('Deal quota notification error:', error);
  }

  return summary;
}
