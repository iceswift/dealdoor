// src/pages/api/deals/[id].ts

export const prerender = false;

import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { deals, analyticsEvents } from '../../../../db/schema';
import { eq } from 'drizzle-orm';
import { handleApiError, notFound } from '../../../lib/errors';

export const GET: APIRoute = async ({ params }) => {
  try {
    const deal = await db.select().from(deals).where(eq(deals.id, params.id!)).get();

    if (!deal) {
      throw notFound('ไม่พบข้อมูลดีล');
    }

    return new Response(
      JSON.stringify({ success: true, data: deal }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return handleApiError(error);
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const data = await request.json();
    const dealId = params.id!;

    // Check if deal exists
    const existing = await db.select().from(deals).where(eq(deals.id, dealId)).get();
    if (!existing) {
      throw notFound('ไม่พบข้อมูลดีล');
    }

    // Update deal
    await db.update(deals)
      .set({
        title: data.title || existing.title,
        category: data.category || existing.category,
        description: data.description !== undefined ? data.description : existing.description,
        shortDescription: data.shortDescription !== undefined ? data.shortDescription : existing.shortDescription,
        discountText: data.discountText !== undefined ? data.discountText : existing.discountText,
        conditions: data.conditions !== undefined ? data.conditions : existing.conditions,
        couponCode: data.couponCode !== undefined ? data.couponCode : existing.couponCode,
        claimType: data.claimType || existing.claimType,
        endDate: data.endDate ? new Date(data.endDate) : existing.endDate,
        isActive: data.isActive !== undefined ? data.isActive : existing.isActive,
        updatedAt: new Date(),
      })
      .where(eq(deals.id, dealId));

    const updatedDeal = await db.select().from(deals).where(eq(deals.id, dealId)).get();

    return new Response(
      JSON.stringify({ success: true, data: updatedDeal }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return handleApiError(error);
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  try {
    const dealId = params.id!;

    // Check if deal exists
    const existing = await db.select().from(deals).where(eq(deals.id, dealId)).get();
    if (!existing) {
      throw notFound('ไม่พบข้อมูลดีล');
    }

    // Delete associated analytics events first to avoid FK constraint error
    await db.delete(analyticsEvents).where(eq(analyticsEvents.dealId, dealId));

    await db.delete(deals).where(eq(deals.id, dealId));

    return new Response(
      JSON.stringify({ success: true, message: 'ลบดีลสำเร็จ' }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return handleApiError(error);
  }
};

export const PATCH: APIRoute = async ({ params, request }) => {
  try {
    const data = await request.json();
    const dealId = params.id!;

    // Check if deal exists
    const existing = await db.select().from(deals).where(eq(deals.id, dealId)).get();
    if (!existing) {
      throw notFound('ไม่พบข้อมูลดีล');
    }

    // Toggle active status
    await db.update(deals)
      .set({
        isActive: data.isActive,
        updatedAt: new Date(),
      })
      .where(eq(deals.id, dealId));

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return handleApiError(error);
  }
};
