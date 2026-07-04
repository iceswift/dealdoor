// src/pages/api/analytics/stats.ts

export const prerender = false;

import type { APIRoute } from 'astro';
import { getShopStats, getTopDeals } from '../../../lib/analytics';
import { handleApiError, badRequest } from '../../../lib/errors';

export const GET: APIRoute = async ({ url }) => {
  try {
    const shopId = url.searchParams.get('shopId');
    const days = parseInt(url.searchParams.get('days') || '30');

    if (!shopId) {
      throw badRequest('VALIDATION_ERROR', 'กรุณาระบุ shopId');
    }

    const { stats, totals } = await getShopStats(shopId, days);
    const topDeals = await getTopDeals(shopId, 5);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          stats,
          totals,
          topDeals,
        },
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return handleApiError(error);
  }
};
