import type { APIRoute } from 'astro';
import { forbidden, handleApiError, unauthorized } from '../../../../lib/errors';
import { json } from '../../../../lib/dashboard/server';
import { getAdminBoostQueue } from '../../../../server/services/boost.service';

export const GET: APIRoute = async ({ locals }) => {
  try {
    if (!locals.user) throw unauthorized();
    if (locals.user.role !== 'admin') throw forbidden('Admin access required');
    return json({ success: true, data: await getAdminBoostQueue() });
  } catch (error) {
    return handleApiError(error);
  }
};
