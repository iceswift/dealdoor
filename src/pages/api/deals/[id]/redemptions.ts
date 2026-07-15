export const prerender = false;

import type { APIRoute } from 'astro';
import { handleApiError } from '../../../../lib/errors';
import { json, requireDashboardShop } from '../../../../lib/dashboard/server';
import { confirmDealRedemptionForShop } from '../../../../server/services/deal.service';

export const POST: APIRoute = async ({ params, locals, request }) => {
  try {
    const { shop } = await requireDashboardShop(locals.user);
    const summary = await confirmDealRedemptionForShop(params.id!, shop.id, {
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return json({ success: true, data: summary });
  } catch (error) {
    return handleApiError(error);
  }
};
