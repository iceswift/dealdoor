import type { APIRoute } from 'astro';
import { badRequest, handleApiError } from '../../../lib/errors';
import { json, requireDashboardShop } from '../../../lib/dashboard/server';
import {
  deleteSpecialHourForShop,
  updateSpecialHourForShop,
} from '../../../server/services/special-hours.service';

export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    const { shop } = await requireDashboardShop(locals.user);
    const id = params.id;
    if (!id) throw badRequest('MISSING_ID', 'ไม่พบรหัสเวลาพิเศษ');

    const item = await updateSpecialHourForShop(id, shop.id, await request.json());
    return json({ success: true, data: item });
  } catch (error) {
    return handleApiError(error);
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    const { shop } = await requireDashboardShop(locals.user);
    const id = params.id;
    if (!id) throw badRequest('MISSING_ID', 'ไม่พบรหัสเวลาพิเศษ');

    await deleteSpecialHourForShop(id, shop.id);
    return json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
};
