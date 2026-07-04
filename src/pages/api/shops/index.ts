// src/pages/api/shops/index.ts

import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { shops } from '../../../../db/schema';
import { eq } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { handleApiError, badRequest } from '../../../lib/errors';
import { shopSchema, validateInput } from '../../../lib/validations';
import { sanitizeSlug } from '../../../lib/security';

export const GET: APIRoute = async () => {
  try {
    const allShops = await db.select().from(shops);
    return new Response(
      JSON.stringify({ success: true, data: allShops }),
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
    const validation = validateInput(shopSchema, rawData);
    if (!validation.success) {
      throw badRequest('VALIDATION_ERROR', 'ข้อมูลไม่ถูกต้อง', validation.errors);
    }

    const data = validation.data!;

    // Generate slug from shop name
    const slug = sanitizeSlug(data.name);

    // Check if slug exists
    const existing = await db.select().from(shops).where(eq(shops.slug, slug)).get();
    if (existing) {
      throw badRequest('SLUG_TAKEN', 'ลิงก์นี้ถูกใช้แล้ว', { slug });
    }

    const shopId = createId();
    const merchantId = data.merchantId || createId();

    await db.insert(shops).values({
      id: shopId,
      merchantId,
      slug,
      name: data.name,
      description: data.description || null,
      category: data.category,
      address: data.address || null,
      phone: data.phone || null,
      lineId: data.lineId || null,
      facebookUrl: data.facebookUrl || null,
      instagramUrl: data.instagramUrl || null,
      websiteUrl: data.websiteUrl || null,
      coverImage: data.coverImage || null,
      logoImage: data.logoImage || null,
      isOpen: true,
      tier: 'free',
      maxActiveDeals: 6,
    });

    const newShop = await db.select().from(shops).where(eq(shops.id, shopId)).get();

    return new Response(
      JSON.stringify({ success: true, data: newShop }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return handleApiError(error);
  }
};
