// src/pages/api/analytics/stats.ts

export const prerender = false;

import type { APIRoute } from 'astro';
import { getShopStats, getTopDeals } from '../../../lib/analytics';
import { handleApiError } from '../../../lib/errors';
import { json, requireDashboardShop } from '../../../lib/dashboard/server';

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const { shop } = await requireDashboardShop(locals.user);
    const days = Math.min(365, Math.max(7, parseInt(url.searchParams.get('days') || '30', 10)));
    const { stats, totals } = await getShopStats(shop.id, days);
    const topDeals = await getTopDeals(shop.id, 5);

    return json({
      success: true,
      data: {
        stats,
        totals,
        topDeals,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
};
