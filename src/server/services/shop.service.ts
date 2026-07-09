import { createId } from '@paralleldrive/cuid2';
import { eq } from 'drizzle-orm';
import type { z } from 'zod';
import { shops, type Shop } from '../../lib/db-schema';
import { db } from '../../lib/db';
import { firstRow } from '../../lib/db-query';
import { badRequest, conflict, notFound } from '../../lib/errors';
import { sanitizeSlug } from '../../lib/security';
import { shopSchema, validateInput } from '../../lib/validations';
import { assertShopOwnership, type DashboardContext } from '../../lib/dashboard/server';

type ShopCreateInput = z.infer<typeof shopSchema>;
type ShopUpdateInput = Partial<ShopCreateInput>;

function nullableText(value: string | undefined | null) {
  return value || null;
}

function createShopValues(data: ShopCreateInput, merchantId: string, slug: string) {
  return {
    id: createId(),
    merchantId,
    slug,
    name: data.name,
    description: nullableText(data.description),
    category: data.category,
    address: nullableText(data.address),
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    openingHours: nullableText(data.openingHours),
    isOpen: data.isOpen ?? true,
    vacationMode: data.vacationMode ?? false,
    vacationMessage: nullableText(data.vacationMessage),
    vacationUntil: data.vacationUntil ?? null,
    phone: nullableText(data.phone),
    lineId: nullableText(data.lineId),
    facebookUrl: nullableText(data.facebookUrl),
    instagramUrl: nullableText(data.instagramUrl),
    tiktokUrl: nullableText(data.tiktokUrl),
    websiteUrl: nullableText(data.websiteUrl),
    acceptsPromptPay: data.acceptsPromptPay ?? false,
    acceptsCash: data.acceptsCash ?? true,
    acceptsCreditCard: data.acceptsCreditCard ?? false,
    acceptsTrueMoney: data.acceptsTrueMoney ?? false,
    acceptsRabbitLinePay: data.acceptsRabbitLinePay ?? false,
    paymentNotes: nullableText(data.paymentNotes),
    wheelchairAccessible: data.wheelchairAccessible ?? false,
    strollerAccessible: data.strollerAccessible ?? false,
    seniorFriendlyRestroom: data.seniorFriendlyRestroom ?? false,
    elevatorAvailable: data.elevatorAvailable ?? false,
    brailleMenu: data.brailleMenu ?? false,
    accessibilityNotes: nullableText(data.accessibilityNotes),
    freeParking: data.freeParking ?? false,
    paidParking: data.paidParking ?? false,
    motorcycleParking: data.motorcycleParking ?? false,
    evCharging: data.evCharging ?? false,
    nearbyBts: nullableText(data.nearbyBts),
    nearbyMrt: nullableText(data.nearbyMrt),
    parkingNotes: nullableText(data.parkingNotes),
    petFriendly: data.petFriendly ?? false,
    petMenu: data.petMenu ?? false,
    petWaterBowl: data.petWaterBowl ?? false,
    petNotes: nullableText(data.petNotes),
    kidsMenu: data.kidsMenu ?? false,
    highChairs: data.highChairs ?? false,
    playArea: data.playArea ?? false,
    babyChanging: data.babyChanging ?? false,
    familyNotes: nullableText(data.familyNotes),
    coverImage: nullableText(data.coverImage),
    logoImage: nullableText(data.logoImage),
    tier: 'free',
    maxActiveDeals: 6,
  };
}

function updateShopValues(data: ShopUpdateInput, existing: Shop) {
  return {
    name: data.name ?? existing.name,
    description: data.description !== undefined ? nullableText(data.description) : existing.description,
    category: data.category ?? existing.category,
    address: data.address !== undefined ? nullableText(data.address) : existing.address,
    latitude: data.latitude !== undefined ? data.latitude ?? null : existing.latitude,
    longitude: data.longitude !== undefined ? data.longitude ?? null : existing.longitude,
    openingHours: data.openingHours !== undefined ? nullableText(data.openingHours) : existing.openingHours,
    isOpen: data.isOpen !== undefined ? data.isOpen : existing.isOpen,
    vacationMode: data.vacationMode !== undefined ? data.vacationMode : existing.vacationMode,
    vacationMessage: data.vacationMessage !== undefined ? nullableText(data.vacationMessage) : existing.vacationMessage,
    vacationUntil: data.vacationUntil !== undefined ? data.vacationUntil ?? null : existing.vacationUntil,
    phone: data.phone !== undefined ? nullableText(data.phone) : existing.phone,
    lineId: data.lineId !== undefined ? nullableText(data.lineId) : existing.lineId,
    facebookUrl: data.facebookUrl !== undefined ? nullableText(data.facebookUrl) : existing.facebookUrl,
    instagramUrl: data.instagramUrl !== undefined ? nullableText(data.instagramUrl) : existing.instagramUrl,
    tiktokUrl: data.tiktokUrl !== undefined ? nullableText(data.tiktokUrl) : existing.tiktokUrl,
    websiteUrl: data.websiteUrl !== undefined ? nullableText(data.websiteUrl) : existing.websiteUrl,
    acceptsPromptPay: data.acceptsPromptPay !== undefined ? data.acceptsPromptPay : existing.acceptsPromptPay,
    acceptsCash: data.acceptsCash !== undefined ? data.acceptsCash : existing.acceptsCash,
    acceptsCreditCard: data.acceptsCreditCard !== undefined ? data.acceptsCreditCard : existing.acceptsCreditCard,
    acceptsTrueMoney: data.acceptsTrueMoney !== undefined ? data.acceptsTrueMoney : existing.acceptsTrueMoney,
    acceptsRabbitLinePay: data.acceptsRabbitLinePay !== undefined ? data.acceptsRabbitLinePay : existing.acceptsRabbitLinePay,
    paymentNotes: data.paymentNotes !== undefined ? nullableText(data.paymentNotes) : existing.paymentNotes,
    wheelchairAccessible: data.wheelchairAccessible !== undefined ? data.wheelchairAccessible : existing.wheelchairAccessible,
    strollerAccessible: data.strollerAccessible !== undefined ? data.strollerAccessible : existing.strollerAccessible,
    seniorFriendlyRestroom: data.seniorFriendlyRestroom !== undefined ? data.seniorFriendlyRestroom : existing.seniorFriendlyRestroom,
    elevatorAvailable: data.elevatorAvailable !== undefined ? data.elevatorAvailable : existing.elevatorAvailable,
    brailleMenu: data.brailleMenu !== undefined ? data.brailleMenu : existing.brailleMenu,
    accessibilityNotes: data.accessibilityNotes !== undefined ? nullableText(data.accessibilityNotes) : existing.accessibilityNotes,
    freeParking: data.freeParking !== undefined ? data.freeParking : existing.freeParking,
    paidParking: data.paidParking !== undefined ? data.paidParking : existing.paidParking,
    motorcycleParking: data.motorcycleParking !== undefined ? data.motorcycleParking : existing.motorcycleParking,
    evCharging: data.evCharging !== undefined ? data.evCharging : existing.evCharging,
    nearbyBts: data.nearbyBts !== undefined ? nullableText(data.nearbyBts) : existing.nearbyBts,
    nearbyMrt: data.nearbyMrt !== undefined ? nullableText(data.nearbyMrt) : existing.nearbyMrt,
    parkingNotes: data.parkingNotes !== undefined ? nullableText(data.parkingNotes) : existing.parkingNotes,
    petFriendly: data.petFriendly !== undefined ? data.petFriendly : existing.petFriendly,
    petMenu: data.petMenu !== undefined ? data.petMenu : existing.petMenu,
    petWaterBowl: data.petWaterBowl !== undefined ? data.petWaterBowl : existing.petWaterBowl,
    petNotes: data.petNotes !== undefined ? nullableText(data.petNotes) : existing.petNotes,
    kidsMenu: data.kidsMenu !== undefined ? data.kidsMenu : existing.kidsMenu,
    highChairs: data.highChairs !== undefined ? data.highChairs : existing.highChairs,
    playArea: data.playArea !== undefined ? data.playArea : existing.playArea,
    babyChanging: data.babyChanging !== undefined ? data.babyChanging : existing.babyChanging,
    familyNotes: data.familyNotes !== undefined ? nullableText(data.familyNotes) : existing.familyNotes,
    coverImage: data.coverImage !== undefined ? nullableText(data.coverImage) : existing.coverImage,
    logoImage: data.logoImage !== undefined ? nullableText(data.logoImage) : existing.logoImage,
    updatedAt: new Date(),
  };
}

export async function listShops() {
  return db.select().from(shops);
}

export async function getShopById(shopId: string) {
  const shop = await firstRow(db.select().from(shops).where(eq(shops.id, shopId)).limit(1));
  if (!shop) {
    throw notFound('ไม่พบข้อมูลร้าน');
  }
  return shop;
}

export async function createShopForMerchant(context: DashboardContext, rawData: unknown) {
  if (context.shop) {
    throw conflict('SHOP_ALREADY_EXISTS', 'บัญชีนี้มีร้านค้าแล้ว');
  }

  const validation = validateInput(shopSchema.omit({ merchantId: true }), rawData);
  if (!validation.success) {
    throw badRequest('VALIDATION_ERROR', 'ข้อมูลร้านค้าไม่ถูกต้อง', validation.errors);
  }

  const data = validation.data!;
  const slug = sanitizeSlug(data.name);
  const existingSlug = await firstRow(db.select().from(shops).where(eq(shops.slug, slug)).limit(1));
  if (existingSlug) {
    throw badRequest('SLUG_TAKEN', 'ลิงก์ร้านนี้ถูกใช้แล้ว', { slug });
  }

  const values = createShopValues(data, context.merchant.id, slug);
  await db.insert(shops).values(values);
  return getShopById(values.id);
}

export async function updateShopForMerchant(shopId: string, merchantId: string, rawData: unknown) {
  const existing = await assertShopOwnership(shopId, merchantId);
  const validation = validateInput(shopSchema.omit({ merchantId: true }).partial(), rawData);

  if (!validation.success) {
    throw badRequest('VALIDATION_ERROR', 'ข้อมูลร้านค้าไม่ถูกต้อง', validation.errors);
  }

  await db
    .update(shops)
    .set(updateShopValues(validation.data!, existing))
    .where(eq(shops.id, shopId));

  return getShopById(shopId);
}
