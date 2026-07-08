import { createId } from '@paralleldrive/cuid2';
import { eq } from 'drizzle-orm';
import { deals, type Shop } from '../../../db/schema';
import { badRequest, unprocessable } from '../../lib/errors';
import { db } from '../../lib/db';
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
