// src/pages/api/menu-items/index.ts

import type { APIRoute } from 'astro';
import { handleApiError } from '../../../lib/errors';
import { json, requireDashboardShop } from '../../../lib/dashboard/server';
import { createMenuItemForShop, listMenuItemsForShop } from '../../../server/services/menu.service';

export const GET: APIRoute = async ({ locals }) => {
  try {
    const { shop } = await requireDashboardShop(locals.user);
    const items = await listMenuItemsForShop(shop.id);
    return json({ success: true, data: items });
  } catch (error) {
    return handleApiError(error);
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { shop } = await requireDashboardShop(locals.user);
    const item = await createMenuItemForShop(shop, await request.json());
    return json({ success: true, data: item }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
};
