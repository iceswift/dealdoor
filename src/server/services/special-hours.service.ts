import { createId } from '@paralleldrive/cuid2';
import { eq } from 'drizzle-orm';
import { shopSpecialHours } from '../../../db/schema';
import { badRequest } from '../../lib/errors';
import { db } from '../../lib/db';
import {
  getOwnedSpecialHour,
  listDashboardSpecialHours,
} from '../../lib/dashboard/server';

type NormalizedSpecialHourInput = {
  date: string;
  isClosed: boolean;
  openTime: string | null;
  closeTime: string | null;
  note: string | null;
};

export function normalizeSpecialHourInput(raw: any): NormalizedSpecialHourInput {
  const date = typeof raw?.date === 'string' ? raw.date.trim() : '';
  const isClosed = Boolean(raw?.isClosed);
  const openTime = typeof raw?.openTime === 'string' ? raw.openTime.trim() : '';
  const closeTime = typeof raw?.closeTime === 'string' ? raw.closeTime.trim() : '';
  const note = typeof raw?.note === 'string' ? raw.note.trim() : '';

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw badRequest('VALIDATION_ERROR', 'กรุณาเลือกวันที่ให้ถูกต้อง');
  }

  if (!isClosed && (!/^\d{2}:\d{2}$/.test(openTime) || !/^\d{2}:\d{2}$/.test(closeTime))) {
    throw badRequest('VALIDATION_ERROR', 'กรุณาเลือกเวลาเปิดและเวลาปิด');
  }

  if (!isClosed && openTime >= closeTime) {
    throw badRequest('VALIDATION_ERROR', 'เวลาเปิดต้องมาก่อนเวลาปิด');
  }

  return {
    date,
    isClosed,
    openTime: isClosed ? null : openTime,
    closeTime: isClosed ? null : closeTime,
    note: note || null,
  };
}

export async function listSpecialHoursForShop(shopId: string) {
  return listDashboardSpecialHours(shopId);
}

export async function getSpecialHourForShop(id: string, shopId: string) {
  return getOwnedSpecialHour(id, shopId);
}

export async function createSpecialHourForShop(shopId: string, rawData: unknown) {
  const data = normalizeSpecialHourInput(rawData);
  const id = createId();

  await db.insert(shopSpecialHours).values({
    id,
    shopId,
    date: data.date,
    isClosed: data.isClosed,
    openTime: data.openTime,
    closeTime: data.closeTime,
    note: data.note,
    updatedAt: new Date(),
  });

  return getSpecialHourForShop(id, shopId);
}

export async function updateSpecialHourForShop(id: string, shopId: string, rawData: unknown) {
  await getSpecialHourForShop(id, shopId);
  const data = normalizeSpecialHourInput(rawData);

  await db
    .update(shopSpecialHours)
    .set({
      date: data.date,
      isClosed: data.isClosed,
      openTime: data.openTime,
      closeTime: data.closeTime,
      note: data.note,
      updatedAt: new Date(),
    })
    .where(eq(shopSpecialHours.id, id));

  return getSpecialHourForShop(id, shopId);
}

export async function deleteSpecialHourForShop(id: string, shopId: string) {
  await getSpecialHourForShop(id, shopId);
  await db.delete(shopSpecialHours).where(eq(shopSpecialHours.id, id));
}
