import { createId } from '@paralleldrive/cuid2';
import { eq } from 'drizzle-orm';
import { menuItems, type Shop } from '../../../db/schema';
import { badRequest, unprocessable } from '../../lib/errors';
import { db } from '../../lib/db';
import { getTierLimits, type Tier } from '../../lib/tiers';
import {
  getOwnedMenuItem,
  listDashboardMenuItems,
} from '../../lib/dashboard/server';

type NormalizedMenuInput = {
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number | null;
  sortOrder: number;
};

export function normalizeMenuInput(raw: any): NormalizedMenuInput {
  const name = typeof raw?.name === 'string' ? raw.name.trim() : '';
  const description = typeof raw?.description === 'string' ? raw.description.trim() : '';
  const imageUrl = typeof raw?.imageUrl === 'string' ? raw.imageUrl.trim() : '';
  const sortOrder = Number.isFinite(Number(raw?.sortOrder)) ? Math.max(0, Math.round(Number(raw.sortOrder))) : 0;
  const priceRaw = raw?.price === '' || raw?.price === null || raw?.price === undefined ? null : Number(raw.price);

  if (!name) {
    throw badRequest('VALIDATION_ERROR', 'กรุณากรอกชื่อเมนูหรือสินค้า');
  }

  if (priceRaw !== null && (!Number.isFinite(priceRaw) || priceRaw < 0)) {
    throw badRequest('VALIDATION_ERROR', 'ราคาต้องเป็นตัวเลขมากกว่าหรือเท่ากับ 0');
  }

  return {
    name,
    description: description || null,
    imageUrl: imageUrl || null,
    price: priceRaw,
    sortOrder,
  };
}

export async function listMenuItemsForShop(shopId: string) {
  return listDashboardMenuItems(shopId);
}

export async function getMenuItemForShop(itemId: string, shopId: string) {
  return getOwnedMenuItem(itemId, shopId);
}

export async function createMenuItemForShop(shop: Shop, rawData: unknown) {
  const currentItems = await listMenuItemsForShop(shop.id);
  const tier = (shop.tier as Tier) || 'free';
  const maxMenuItems = getTierLimits(tier).maxMenuItems;

  if (currentItems.length >= maxMenuItems) {
    throw unprocessable('MENU_LIMIT_REACHED', `แพ็กเกจของคุณเพิ่มเมนูได้สูงสุด ${maxMenuItems} รายการ`, {
      current: currentItems.length,
      max: maxMenuItems,
      tier,
    });
  }

  const data = normalizeMenuInput(rawData);
  const id = createId();

  await db.insert(menuItems).values({
    id,
    shopId: shop.id,
    name: data.name,
    description: data.description,
    price: data.price,
    imageUrl: data.imageUrl,
    sortOrder: data.sortOrder || currentItems.length,
  });

  return getMenuItemForShop(id, shop.id);
}

export async function updateMenuItemForShop(itemId: string, shopId: string, rawData: unknown) {
  await getMenuItemForShop(itemId, shopId);
  const data = normalizeMenuInput(rawData);

  await db
    .update(menuItems)
    .set({
      name: data.name,
      description: data.description,
      price: data.price,
      imageUrl: data.imageUrl,
      sortOrder: data.sortOrder,
    })
    .where(eq(menuItems.id, itemId));

  return getMenuItemForShop(itemId, shopId);
}

export async function deleteMenuItemForShop(itemId: string, shopId: string) {
  await getMenuItemForShop(itemId, shopId);
  await db.delete(menuItems).where(eq(menuItems.id, itemId));
}
