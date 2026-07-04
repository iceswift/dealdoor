// src/pages/api/analytics/track.ts

export const prerender = false;

import type { APIRoute } from 'astro';
import { trackEvent, type EventType } from '../../../lib/analytics';
import { handleApiError, badRequest } from '../../../lib/errors';

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();

    // Validate
    if (!data.type || !data.shopId) {
      throw badRequest('VALIDATION_ERROR', 'กรุณาระบุ type และ shopId');
    }

    // Track event
    await trackEvent({
      type: data.type as EventType,
      shopId: data.shopId,
      dealId: data.dealId,
      metadata: data.metadata,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return handleApiError(error);
  }
};
