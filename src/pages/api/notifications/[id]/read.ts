// src/pages/api/notifications/[id]/read.ts

export const prerender = false;

import type { APIRoute } from 'astro';
import { handleApiError, unauthorized } from '../../../../lib/errors';
import { getDashboardContext, json } from '../../../../lib/dashboard/server';
import { markNotificationRead } from '../../../../server/services/notification.service';

export const POST: APIRoute = async ({ params, locals }) => {
  try {
    if (!locals.user) throw unauthorized();
    const context = await getDashboardContext(locals.user);
    await markNotificationRead(params.id, {
      userId: locals.user.id,
      shopId: context?.shop?.id,
    });
    return json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
};
