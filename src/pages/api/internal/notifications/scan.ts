export const prerender = false;

import type { APIRoute } from 'astro';
import { timingSafeEqual } from 'node:crypto';
import { handleApiError, forbidden } from '../../../../lib/errors';
import { json } from '../../../../lib/dashboard/server';
import { executeNotificationScan } from '../../../../server/services/notification.service';

function hasValidSecret(request: Request) {
  const expected = process.env.NOTIFICATION_SCAN_SECRET;
  const supplied = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || '';
  if (!expected || supplied.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(supplied), Buffer.from(expected));
}

export const POST: APIRoute = async ({ request }) => {
  try {
    if (!hasValidSecret(request)) throw forbidden('Invalid internal job secret');
    const result = await executeNotificationScan();
    return json({ success: result.status !== 'failed', data: result }, { status: result.status === 'failed' ? 500 : 200 });
  } catch (error) {
    return handleApiError(error);
  }
};
