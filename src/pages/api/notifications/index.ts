// src/pages/api/notifications/index.ts

export const prerender = false;

import type { APIRoute } from 'astro';
import { handleApiError, unauthorized } from '../../../lib/errors';
import { getDashboardContext, json } from '../../../lib/dashboard/server';
import { getNotificationInbox } from '../../../server/services/notification.service';

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    if (!locals.user) throw unauthorized();
    const context = await getDashboardContext(locals.user);
    const data = await getNotificationInbox(url, {
      userId: locals.user.id,
      shopId: context?.shop?.id,
    });
    return json({ success: true, data });
  } catch (error) {
    return handleApiError(error);
  }
};
