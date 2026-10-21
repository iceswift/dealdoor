import type { APIRoute } from 'astro';
import { handleApiError } from '../../../lib/errors';
import { json, requireDashboardShop } from '../../../lib/dashboard/server';
import { getBoostDashboard, startBoostCampaign } from '../../../server/services/boost.service';

export const GET: APIRoute = async ({ locals }) => {
  try {
    const { shop } = await requireDashboardShop(locals.user);
    return json({ success: true, data: await getBoostDashboard(shop) });
  } catch (error) {
    return handleApiError(error);
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { shop, user } = await requireDashboardShop(locals.user);
    const campaign = await startBoostCampaign(shop, user.id, await request.json());
    return json({ success: true, data: campaign }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
};
