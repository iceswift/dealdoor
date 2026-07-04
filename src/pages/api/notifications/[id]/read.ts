// src/pages/api/notifications/[id]/read.ts

export const prerender = false;

import type { APIRoute } from 'astro';
import { markAsRead, markAllAsRead } from '../../../../lib/notifications';
import { handleApiError } from '../../../../lib/errors';

export const POST: APIRoute = async ({ params, request }) => {
  try {
    const notificationId = params.id;

    if (notificationId === 'all') {
      // Mark all as read
      const data = await request.json();
      await markAllAsRead({
        userId: data.userId,
        shopId: data.shopId,
      });
    } else {
      // Mark single as read
      await markAsRead(notificationId!);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return handleApiError(error);
  }
};
