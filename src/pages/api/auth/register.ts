// src/pages/api/auth/register.ts

export const prerender = false;

import type { APIRoute } from 'astro';
import { handleApiError, ApiError } from '../../../lib/errors';
import { getDemoPolicy } from '../../../lib/demo';
import { json } from '../../../lib/dashboard/server';
import { registerMerchant } from '../../../server/services/auth.service';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    if (!getDemoPolicy().registrationAllowed) throw new ApiError(403, 'DEMO_FEATURE_DISABLED', 'Demo: registration is disabled. Please use a sample account.');
    const user = await registerMerchant(await request.json(), cookies, request);
    return json({ success: true, data: user }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
};
