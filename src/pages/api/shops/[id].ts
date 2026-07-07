// src/pages/api/shops/[id].ts

export const prerender = false;

import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { shops } from '../../../../db/schema';
import { eq } from 'drizzle-orm';
import { handleApiError, notFound, badRequest } from '../../../lib/errors';
import { shopSchema, validateInput } from '../../../lib/validations';

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
    const rawData = await request.json();
    const shopId = params.id!;

    const existing = await db.select().from(shops).where(eq(shops.id, shopId)).get();
    if (!existing) {
      throw notFound('ไม่พบข้อมูลร้าน');
    }

    const validation = validateInput(shopSchema.partial(), rawData);
    if (!validation.success) {
      throw badRequest('VALIDATION_ERROR', 'ข้อมูลไม่ถูกต้อง', validation.errors);
    }

    const data = validation.data!;

    await db.update(shops)
      .set({
        name: data.name ?? existing.name,
        description: data.description !== undefined ? data.description || null : existing.description,
        category: data.category ?? existing.category,
        address: data.address !== undefined ? data.address || null : existing.address,
        latitude: data.latitude !== undefined ? data.latitude ?? null : existing.latitude,
        longitude: data.longitude !== undefined ? data.longitude ?? null : existing.longitude,
        openingHours: data.openingHours !== undefined ? data.openingHours || null : existing.openingHours,
        isOpen: data.isOpen !== undefined ? data.isOpen : existing.isOpen,
        phone: data.phone !== undefined ? data.phone || null : existing.phone,
        lineId: data.lineId !== undefined ? data.lineId || null : existing.lineId,
        facebookUrl: data.facebookUrl !== undefined ? data.facebookUrl || null : existing.facebookUrl,
        instagramUrl: data.instagramUrl !== undefined ? data.instagramUrl || null : existing.instagramUrl,
        tiktokUrl: data.tiktokUrl !== undefined ? data.tiktokUrl || null : existing.tiktokUrl,
        websiteUrl: data.websiteUrl !== undefined ? data.websiteUrl || null : existing.websiteUrl,
        acceptsPromptPay: data.acceptsPromptPay !== undefined ? data.acceptsPromptPay : existing.acceptsPromptPay,
        acceptsCash: data.acceptsCash !== undefined ? data.acceptsCash : existing.acceptsCash,
        acceptsCreditCard: data.acceptsCreditCard !== undefined ? data.acceptsCreditCard : existing.acceptsCreditCard,
        acceptsTrueMoney: data.acceptsTrueMoney !== undefined ? data.acceptsTrueMoney : existing.acceptsTrueMoney,
        acceptsRabbitLinePay: data.acceptsRabbitLinePay !== undefined ? data.acceptsRabbitLinePay : existing.acceptsRabbitLinePay,
        paymentNotes: data.paymentNotes !== undefined ? data.paymentNotes || null : existing.paymentNotes,
        wheelchairAccessible: data.wheelchairAccessible !== undefined ? data.wheelchairAccessible : existing.wheelchairAccessible,
        strollerAccessible: data.strollerAccessible !== undefined ? data.strollerAccessible : existing.strollerAccessible,
        seniorFriendlyRestroom: data.seniorFriendlyRestroom !== undefined ? data.seniorFriendlyRestroom : existing.seniorFriendlyRestroom,
        elevatorAvailable: data.elevatorAvailable !== undefined ? data.elevatorAvailable : existing.elevatorAvailable,
        brailleMenu: data.brailleMenu !== undefined ? data.brailleMenu : existing.brailleMenu,
        accessibilityNotes: data.accessibilityNotes !== undefined ? data.accessibilityNotes || null : existing.accessibilityNotes,
        freeParking: data.freeParking !== undefined ? data.freeParking : existing.freeParking,
        paidParking: data.paidParking !== undefined ? data.paidParking : existing.paidParking,
        motorcycleParking: data.motorcycleParking !== undefined ? data.motorcycleParking : existing.motorcycleParking,
        evCharging: data.evCharging !== undefined ? data.evCharging : existing.evCharging,
        nearbyBts: data.nearbyBts !== undefined ? data.nearbyBts || null : existing.nearbyBts,
        nearbyMrt: data.nearbyMrt !== undefined ? data.nearbyMrt || null : existing.nearbyMrt,
        parkingNotes: data.parkingNotes !== undefined ? data.parkingNotes || null : existing.parkingNotes,
        petFriendly: data.petFriendly !== undefined ? data.petFriendly : existing.petFriendly,
        petMenu: data.petMenu !== undefined ? data.petMenu : existing.petMenu,
        petWaterBowl: data.petWaterBowl !== undefined ? data.petWaterBowl : existing.petWaterBowl,
        petNotes: data.petNotes !== undefined ? data.petNotes || null : existing.petNotes,
        kidsMenu: data.kidsMenu !== undefined ? data.kidsMenu : existing.kidsMenu,
        highChairs: data.highChairs !== undefined ? data.highChairs : existing.highChairs,
        playArea: data.playArea !== undefined ? data.playArea : existing.playArea,
        babyChanging: data.babyChanging !== undefined ? data.babyChanging : existing.babyChanging,
        familyNotes: data.familyNotes !== undefined ? data.familyNotes || null : existing.familyNotes,
        coverImage: data.coverImage !== undefined ? data.coverImage || null : existing.coverImage,
        logoImage: data.logoImage !== undefined ? data.logoImage || null : existing.logoImage,
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
