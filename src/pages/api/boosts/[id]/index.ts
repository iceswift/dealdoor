import type { APIRoute } from 'astro';
import { handleApiError } from '../../../../lib/errors';
import { json, requireDashboardShop } from '../../../../lib/dashboard/server';
import { stopBoostCampaign } from '../../../../server/services/boost.service';

export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    const { shop } = await requireDashboardShop(locals.user);
    await stopBoostCampaign(shop, params.id || '');
    return json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
};
