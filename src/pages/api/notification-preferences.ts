export const prerender = false;

import type { APIRoute } from 'astro';
import { handleApiError, unauthorized } from '../../lib/errors';
import { json } from '../../lib/dashboard/server';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from '../../server/services/notification.service';

export const GET: APIRoute = async ({ locals }) => {
  try {
    if (!locals.user) throw unauthorized();
    return json({ success: true, data: await getNotificationPreferences(locals.user.id) });
  } catch (error) {
    return handleApiError(error);
  }
};

export const PUT: APIRoute = async ({ locals, request }) => {
  try {
    if (!locals.user) throw unauthorized();
    return json({
      success: true,
      data: await updateNotificationPreferences(locals.user.id, await request.json()),
    });
  } catch (error) {
    return handleApiError(error);
  }
};
