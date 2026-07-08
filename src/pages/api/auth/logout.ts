// src/pages/api/auth/logout.ts

export const prerender = false;

import type { APIRoute } from 'astro';
import { handleApiError } from '../../../lib/errors';
import { json } from '../../../lib/dashboard/server';
import { logoutCurrentSession } from '../../../server/services/auth.service';

export const POST: APIRoute = async ({ cookies }) => {
  try {
    await logoutCurrentSession(cookies);
    return json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
};
