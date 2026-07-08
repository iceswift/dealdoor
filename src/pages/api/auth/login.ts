// src/pages/api/auth/login.ts

export const prerender = false;

import type { APIRoute } from 'astro';
import { handleApiError } from '../../../lib/errors';
import { json } from '../../../lib/dashboard/server';
import { loginWithPassword } from '../../../server/services/auth.service';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const user = await loginWithPassword(await request.json(), cookies, request);
    return json({ success: true, data: user });
  } catch (error) {
    return handleApiError(error);
  }
};
