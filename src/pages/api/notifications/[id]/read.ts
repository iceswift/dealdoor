// src/pages/api/notifications/[id]/read.ts

export const prerender = false;

import type { APIRoute } from 'astro';
import { handleApiError } from '../../../../lib/errors';
import { json } from '../../../../lib/dashboard/server';
import { markNotificationReadFromRequest } from '../../../../server/services/notification.service';

export const POST: APIRoute = async ({ params, request }) => {
  try {
    const body = params.id === 'all' ? await request.json() : undefined;
    await markNotificationReadFromRequest(params.id, body);
    return json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
};
