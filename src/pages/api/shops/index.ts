// src/pages/api/shops/index.ts

import type { APIRoute } from 'astro';
import { handleApiError } from '../../../lib/errors';
import { json, requireDashboardContext } from '../../../lib/dashboard/server';
import { createShopForMerchant, listShops } from '../../../server/services/shop.service';

export const GET: APIRoute = async () => {
  try {
    const allShops = await listShops();
    return json({ success: true, data: allShops });
  } catch (error) {
    return handleApiError(error);
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const context = await requireDashboardContext(locals.user);
    const newShop = await createShopForMerchant(context, await request.json());
    return json({ success: true, data: newShop }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
};
