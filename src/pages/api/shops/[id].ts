// src/pages/api/shops/[id].ts

export const prerender = false;

import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { shops } from '../../../../db/schema';
import { eq } from 'drizzle-orm';
import { handleApiError, notFound } from '../../../lib/errors';

export const GET: APIRoute = async ({ params }) => {
  try {
    const shop = await db.select().from(shops).where(eq(shops.id, params.id!)).get();

    if (!shop) {
      throw notFound('ไม่พบข้อมูลร้าน');
    }

    return new Response(
      JSON.stringify({ success: true, data: shop }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return handleApiError(error);
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const data = await request.json();
    const shopId = params.id!;

    // Check if shop exists
    const existing = await db.select().from(shops).where(eq(shops.id, shopId)).get();
    if (!existing) {
      throw notFound('ไม่พบข้อมูลร้าน');
    }

    // Update shop
    await db.update(shops)
      .set({
        name: data.name || existing.name,
        description: data.description !== undefined ? data.description : existing.description,
        category: data.category || existing.category,
        address: data.address !== undefined ? data.address : existing.address,
        phone: data.phone !== undefined ? data.phone : existing.phone,
        lineId: data.lineId !== undefined ? data.lineId : existing.lineId,
        facebookUrl: data.facebookUrl !== undefined ? data.facebookUrl : existing.facebookUrl,
        instagramUrl: data.instagramUrl !== undefined ? data.instagramUrl : existing.instagramUrl,
        websiteUrl: data.websiteUrl !== undefined ? data.websiteUrl : existing.websiteUrl,
        openingHours: data.openingHours !== undefined ? data.openingHours : existing.openingHours,
        updatedAt: new Date(),
      })
      .where(eq(shops.id, shopId));

    const updatedShop = await db.select().from(shops).where(eq(shops.id, shopId)).get();

    return new Response(
      JSON.stringify({ success: true, data: updatedShop }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return handleApiError(error);
  }
};
