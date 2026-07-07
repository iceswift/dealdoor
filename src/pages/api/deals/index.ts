// src/pages/api/deals/index.ts

import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { deals } from '../../../../db/schema';
import { createId } from '@paralleldrive/cuid2';
import { eq } from 'drizzle-orm';
import { handleApiError, badRequest, unprocessable } from '../../../lib/errors';
import { dealSchema, validateInput } from '../../../lib/validations';
import {
  hasReachedActiveDealLimit,
  json,
  listDashboardDeals,
  requireDashboardShop,
} from '../../../lib/dashboard/server';

export const GET: APIRoute = async ({ locals }) => {
  try {
    const { shop } = await requireDashboardShop(locals.user);
    const shopDeals = await listDashboardDeals(shop.id);
    return json({ success: true, data: shopDeals });
  } catch (error) {
    return handleApiError(error);
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { shop } = await requireDashboardShop(locals.user);
    const rawData = await request.json();

    const validation = validateInput(dealSchema, rawData);
    if (!validation.success) {
      throw badRequest('VALIDATION_ERROR', 'ข้อมูลดีลไม่ถูกต้อง', validation.errors);
    }

    const data = validation.data!;
    const limit = await hasReachedActiveDealLimit(shop);
    if (limit.reached) {
      throw unprocessable('DEAL_LIMIT_REACHED', `แพ็กเกจของคุณเปิดดีลพร้อมกันได้สูงสุด ${limit.max} ดีล`, {
        current: limit.current,
        max: limit.max,
        tier: shop.tier,
      });
    }

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

    const newDeal = await db.select().from(deals).where(eq(deals.id, dealId)).get();

    return json({ success: true, data: newDeal }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
};
