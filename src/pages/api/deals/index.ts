// src/pages/api/deals/index.ts

import type { APIRoute } from 'astro';
import { handleApiError } from '../../../lib/errors';
import { json, requireDashboardShop } from '../../../lib/dashboard/server';
import { createDealForShop, listDealsForShop } from '../../../server/services/deal.service';

export const GET: APIRoute = async ({ locals }) => {
  try {
    const { shop } = await requireDashboardShop(locals.user);
    const shopDeals = await listDealsForShop(shop.id);
    return json({ success: true, data: shopDeals });
  } catch (error) {
    return handleApiError(error);
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { shop } = await requireDashboardShop(locals.user);
    const newDeal = await createDealForShop(shop, await request.json());
    return json({ success: true, data: newDeal }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
};
