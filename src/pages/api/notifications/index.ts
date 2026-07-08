// src/pages/api/notifications/index.ts

export const prerender = false;

import type { APIRoute } from 'astro';
import { handleApiError } from '../../../lib/errors';
import { json } from '../../../lib/dashboard/server';
import { getNotificationInbox } from '../../../server/services/notification.service';

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const data = await getNotificationInbox(url, locals.user?.id);
    return json({ success: true, data });
  } catch (error) {
    return handleApiError(error);
  }
};
