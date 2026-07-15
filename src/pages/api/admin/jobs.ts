export const prerender = false;

import type { APIRoute } from 'astro';
import { json } from '../../../lib/dashboard/server';
import { forbidden, handleApiError, unauthorized } from '../../../lib/errors';
import { getRecentJobRuns } from '../../../server/services/job.service';

export const GET: APIRoute = async ({ locals }) => {
  try {
    if (!locals.user) throw unauthorized();
    if (locals.user.role !== 'admin') throw forbidden('Admin access required');
    return json({ success: true, data: await getRecentJobRuns() });
  } catch (error) {
    return handleApiError(error);
  }
};
