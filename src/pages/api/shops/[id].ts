// src/pages/api/shops/[id].ts

export const prerender = false;

import type { APIRoute } from 'astro';
import { handleApiError } from '../../../lib/errors';
import { json, requireDashboardContext } from '../../../lib/dashboard/server';
import { getShopById, updateShopForMerchant } from '../../../server/services/shop.service';

export const GET: APIRoute = async ({ params }) => {
  try {
    const shop = await getShopById(params.id!);
    return json({ success: true, data: shop });
  } catch (error) {
    return handleApiError(error);
  }
};

export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    const { merchant } = await requireDashboardContext(locals.user);
    const updatedShop = await updateShopForMerchant(params.id!, merchant.id, await request.json());
    return json({ success: true, data: updatedShop });
  } catch (error) {
    return handleApiError(error);
  }
};
