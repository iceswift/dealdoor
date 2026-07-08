// src/pages/api/analytics/stats.ts

export const prerender = false;

import type { APIRoute } from 'astro';
import { handleApiError } from '../../../lib/errors';
import { json, requireDashboardShop } from '../../../lib/dashboard/server';
import {
  getDashboardAnalytics,
  normalizeAnalyticsDays,
} from '../../../server/services/analytics.service';

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const { shop } = await requireDashboardShop(locals.user);
    const days = normalizeAnalyticsDays(url.searchParams.get('days'));
    const { stats, totals, topDeals, source } = await getDashboardAnalytics(shop.id, days);

    return json({
      success: true,
      data: {
        stats,
        totals,
        topDeals,
        source,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
};
