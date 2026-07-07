// src/pages/api/deals/index.ts

import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { deals, shops } from '../../../../db/schema';
import { eq, and, gte } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { handleApiError, badRequest, notFound, unprocessable } from '../../../lib/errors';
import { dealSchema, validateInput } from '../../../lib/validations';

export const GET: APIRoute = async ({ url }) => {
  try {
    const shopId = url.searchParams.get('shopId');

    if (shopId) {
      const shopDeals = await db.select().from(deals).where(eq(deals.shopId, shopId));
      return new Response(
        JSON.stringify({ success: true, data: shopDeals }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    const allDeals = await db.select().from(deals);
    return new Response(
      JSON.stringify({ success: true, data: allDeals }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return handleApiError(error);
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const rawData = await request.json();

    // Validate with Zod
    const validation = validateInput(dealSchema, rawData);
    if (!validation.success) {
      throw badRequest('VALIDATION_ERROR', 'ข้อมูลไม่ถูกต้อง', validation.errors);
    }

    const data = validation.data!;

    // Check if shop exists
    const shop = await db.select().from(shops).where(eq(shops.id, data.shopId!)).get();
    if (!shop) {
      throw notFound('ไม่พบข้อมูลร้าน');
    }

    // Check deal limit
    const now = new Date();
    const activeDeals = await db
      .select()
      .from(deals)
      .where(and(eq(deals.shopId, data.shopId!), eq(deals.isActive, true), gte(deals.endDate, now)));

    if (activeDeals.length >= (shop.maxActiveDeals ?? 6)) {
      throw unprocessable('DEAL_LIMIT_REACHED', `จำกัดดีลสูงสุด ${shop.maxActiveDeals ?? 6} ดีล`, {
        current: activeDeals.length,
        max: shop.maxActiveDeals ?? 6,
        tier: shop.tier,
      });
    }

    const dealId = createId();

    await db.insert(deals).values({
      id: dealId,
      shopId: data.shopId!,
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

    return new Response(
      JSON.stringify({ success: true, data: newDeal }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return handleApiError(error);
  }
};
