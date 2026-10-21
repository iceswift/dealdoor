import type { APIRoute } from 'astro';
import { handleApiError } from '../../../../lib/errors';
import { json, requireDashboardShop } from '../../../../lib/dashboard/server';
import { getBoostAnalytics } from '../../../../server/services/boost.service';

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const { shop } = await requireDashboardShop(locals.user);
    const requestedDays = Number(url.searchParams.get('days'));
    const days = Number.isFinite(requestedDays) ? Math.min(90, Math.max(7, requestedDays)) : 30;
    return json({ success: true, data: await getBoostAnalytics(shop.id, days) });
  } catch (error) {
    return handleApiError(error);
  }
};
