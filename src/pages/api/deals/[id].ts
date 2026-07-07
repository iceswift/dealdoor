// src/pages/api/deals/[id].ts

export const prerender = false;

import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { deals } from '../../../../db/schema';
import { eq } from 'drizzle-orm';
import { handleApiError, badRequest } from '../../../lib/errors';
import { dealSchema, validateInput } from '../../../lib/validations';
import {
  deleteDealWithDashboardRelations,
  getOwnedDeal,
  json,
  requireDashboardShop,
} from '../../../lib/dashboard/server';

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const { shop } = await requireDashboardShop(locals.user);
    const deal = await getOwnedDeal(params.id!, shop.id);
    return json({ success: true, data: deal });
  } catch (error) {
    return handleApiError(error);
  }
};

export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    const { shop } = await requireDashboardShop(locals.user);
    const dealId = params.id!;
    const existing = await getOwnedDeal(dealId, shop.id);
    const rawData = await request.json();

    const validation = validateInput(dealSchema, rawData);
    if (!validation.success) {
      throw badRequest('VALIDATION_ERROR', 'ข้อมูลดีลไม่ถูกต้อง', validation.errors);
    }

    const data = validation.data!;

    await db.update(deals)
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

    const updatedDeal = await getOwnedDeal(dealId, shop.id);
    return json({ success: true, data: updatedDeal });
  } catch (error) {
    return handleApiError(error);
  }
};

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  try {
    const { shop } = await requireDashboardShop(locals.user);
    const dealId = params.id!;
    await getOwnedDeal(dealId, shop.id);

    const data = await request.json();
    if (typeof data.isActive !== 'boolean') {
      throw badRequest('VALIDATION_ERROR', 'สถานะดีลไม่ถูกต้อง');
    }

    await db.update(deals)
      .set({
        isActive: data.isActive,
        updatedAt: new Date(),
      })
      .where(eq(deals.id, dealId));

    return json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    const { shop } = await requireDashboardShop(locals.user);
    const dealId = params.id!;
    await getOwnedDeal(dealId, shop.id);
    await deleteDealWithDashboardRelations(dealId);

    return json({ success: true, message: 'ลบดีลสำเร็จ' });
  } catch (error) {
    return handleApiError(error);
  }
};
