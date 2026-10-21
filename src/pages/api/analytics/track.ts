// src/pages/api/analytics/track.ts

export const prerender = false;

import type { APIRoute } from 'astro';
import { handleApiError } from '../../../lib/errors';
import { json } from '../../../lib/dashboard/server';
import { hasAnalyticsConsent } from '../../../lib/consent';
import { trackEventFromRequest } from '../../../server/services/analytics.service';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    if (!hasAnalyticsConsent(cookies)) {
      return json({ success: true, data: { tracked: false } });
    }

    await trackEventFromRequest(await request.json(), request);
    return json({ success: true, data: { tracked: true } });
  } catch (error) {
    return handleApiError(error);
  }
};
