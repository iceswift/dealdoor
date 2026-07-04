// src/pages/api/notifications/index.ts

export const prerender = false;

import type { APIRoute } from 'astro';
import { getNotifications, getUnreadCount } from '../../../lib/notifications';
import { handleApiError } from '../../../lib/errors';

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const user = locals.user;
    const shopId = url.searchParams.get('shopId');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const unreadOnly = url.searchParams.get('unread') === 'true';

    const params: any = { limit, unreadOnly };
    if (user) params.userId = user.id;
    if (shopId) params.shopId = shopId;

    const notificationsList = await getNotifications(params);
    const unreadCount = await getUnreadCount({ userId: user?.id, shopId: shopId || undefined });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          notifications: notificationsList,
          unreadCount,
        },
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return handleApiError(error);
  }
};
