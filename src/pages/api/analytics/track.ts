// src/pages/api/analytics/track.ts

export const prerender = false;

import type { APIRoute } from 'astro';
import { handleApiError } from '../../../lib/errors';
import { json } from '../../../lib/dashboard/server';
import { trackEventFromRequest } from '../../../server/services/analytics.service';

export const POST: APIRoute = async ({ request }) => {
  try {
    await trackEventFromRequest(await request.json(), request);
    return json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
};
