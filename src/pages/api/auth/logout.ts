// src/pages/api/auth/logout.ts

export const prerender = false;

import type { APIRoute } from 'astro';
import { getSessionCookie, deleteSession, deleteSessionCookie } from '../../../lib/auth';
import { handleApiError } from '../../../lib/errors';

export const POST: APIRoute = async ({ cookies }) => {
  try {
    const sessionId = getSessionCookie(cookies);

    if (sessionId) {
      await deleteSession(sessionId);
    }

    deleteSessionCookie(cookies);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return handleApiError(error);
  }
};
