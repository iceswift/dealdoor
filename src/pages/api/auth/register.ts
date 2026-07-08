// src/pages/api/auth/register.ts

export const prerender = false;

import type { APIRoute } from 'astro';
import { handleApiError } from '../../../lib/errors';
import { json } from '../../../lib/dashboard/server';
import { registerMerchant } from '../../../server/services/auth.service';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const user = await registerMerchant(await request.json(), cookies, request);
    return json({ success: true, data: user }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
};
