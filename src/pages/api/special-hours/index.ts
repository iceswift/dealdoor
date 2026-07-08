// src/pages/api/special-hours/index.ts

import type { APIRoute } from 'astro';
import { handleApiError } from '../../../lib/errors';
import { json, requireDashboardShop } from '../../../lib/dashboard/server';
import {
  createSpecialHourForShop,
  listSpecialHoursForShop,
} from '../../../server/services/special-hours.service';

export const GET: APIRoute = async ({ locals }) => {
  try {
    const { shop } = await requireDashboardShop(locals.user);
    const items = await listSpecialHoursForShop(shop.id);
    return json({ success: true, data: items });
  } catch (error) {
    return handleApiError(error);
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { shop } = await requireDashboardShop(locals.user);
    const item = await createSpecialHourForShop(shop.id, await request.json());
    return json({ success: true, data: item }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
};
