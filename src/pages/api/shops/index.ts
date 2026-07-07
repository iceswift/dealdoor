// src/pages/api/shops/index.ts

import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { shops } from '../../../../db/schema';
import { eq } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { handleApiError, badRequest, conflict } from '../../../lib/errors';
import { shopSchema, validateInput } from '../../../lib/validations';
import { sanitizeSlug } from '../../../lib/security';
import { json, requireDashboardContext } from '../../../lib/dashboard/server';

export const GET: APIRoute = async () => {
  try {
    const allShops = await db.select().from(shops);
    return json({ success: true, data: allShops });
  } catch (error) {
    return handleApiError(error);
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { merchant, shop: existingShop } = await requireDashboardContext(locals.user);
    if (existingShop) {
      throw conflict('SHOP_ALREADY_EXISTS', 'บัญชีนี้มีร้านค้าแล้ว');
    }

    const rawData = await request.json();
    const validation = validateInput(shopSchema.omit({ merchantId: true }), rawData);
    if (!validation.success) {
      throw badRequest('VALIDATION_ERROR', 'ข้อมูลร้านค้าไม่ถูกต้อง', validation.errors);
    }

    const data = validation.data!;
    const slug = sanitizeSlug(data.name);
    const existingSlug = await db.select().from(shops).where(eq(shops.slug, slug)).get();
    if (existingSlug) {
      throw badRequest('SLUG_TAKEN', 'ลิงก์ร้านนี้ถูกใช้แล้ว', { slug });
    }

    const shopId = createId();
    await db.insert(shops).values({
      id: shopId,
      merchantId: merchant.id,
      slug,
      name: data.name,
      description: data.description || null,
      category: data.category,
      address: data.address || null,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      openingHours: data.openingHours || null,
      isOpen: data.isOpen ?? true,
      phone: data.phone || null,
      lineId: data.lineId || null,
      facebookUrl: data.facebookUrl || null,
      instagramUrl: data.instagramUrl || null,
      tiktokUrl: data.tiktokUrl || null,
      websiteUrl: data.websiteUrl || null,
      acceptsPromptPay: data.acceptsPromptPay ?? false,
      acceptsCash: data.acceptsCash ?? true,
      acceptsCreditCard: data.acceptsCreditCard ?? false,
      acceptsTrueMoney: data.acceptsTrueMoney ?? false,
      acceptsRabbitLinePay: data.acceptsRabbitLinePay ?? false,
      paymentNotes: data.paymentNotes || null,
      wheelchairAccessible: data.wheelchairAccessible ?? false,
      strollerAccessible: data.strollerAccessible ?? false,
      seniorFriendlyRestroom: data.seniorFriendlyRestroom ?? false,
      elevatorAvailable: data.elevatorAvailable ?? false,
      brailleMenu: data.brailleMenu ?? false,
      accessibilityNotes: data.accessibilityNotes || null,
      freeParking: data.freeParking ?? false,
      paidParking: data.paidParking ?? false,
      motorcycleParking: data.motorcycleParking ?? false,
      evCharging: data.evCharging ?? false,
      nearbyBts: data.nearbyBts || null,
      nearbyMrt: data.nearbyMrt || null,
      parkingNotes: data.parkingNotes || null,
      petFriendly: data.petFriendly ?? false,
      petMenu: data.petMenu ?? false,
      petWaterBowl: data.petWaterBowl ?? false,
      petNotes: data.petNotes || null,
      kidsMenu: data.kidsMenu ?? false,
      highChairs: data.highChairs ?? false,
      playArea: data.playArea ?? false,
      babyChanging: data.babyChanging ?? false,
      familyNotes: data.familyNotes || null,
      coverImage: data.coverImage || null,
      logoImage: data.logoImage || null,
      tier: 'free',
      maxActiveDeals: 6,
    });

    const newShop = await db.select().from(shops).where(eq(shops.id, shopId)).get();
    return json({ success: true, data: newShop }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
};
