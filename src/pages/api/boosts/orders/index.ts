import type { APIRoute } from 'astro';
import { handleApiError } from '../../../../lib/errors';
import { json, requireDashboardShop } from '../../../../lib/dashboard/server';
import { createBoostCreditOrder, getBoostDashboard } from '../../../../server/services/boost.service';

export const GET: APIRoute = async ({ locals }) => {
  try {
    const { shop } = await requireDashboardShop(locals.user);
    const data = await getBoostDashboard(shop);
    return json({ success: true, data: { orders: data.orders, packages: data.creditPackages } });
  } catch (error) {
    return handleApiError(error);
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { shop } = await requireDashboardShop(locals.user);
    const result = await createBoostCreditOrder(shop, await request.json());
    return json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
};
