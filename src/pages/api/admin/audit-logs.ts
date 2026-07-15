export const prerender = false;

import type { APIRoute } from 'astro';
import { json } from '../../../lib/dashboard/server';
import { forbidden, handleApiError, unauthorized } from '../../../lib/errors';
import { getAdminAuditLogs } from '../../../server/services/admin-audit.service';

export const GET: APIRoute = async ({ locals, url }) => {
  try {
    if (!locals.user) throw unauthorized();
    if (locals.user.role !== 'admin') throw forbidden('Admin access required');
    const limit = Number.parseInt(url.searchParams.get('limit') || '50', 10);
    return json({ success: true, data: await getAdminAuditLogs({
      limit,
      action: url.searchParams.get('action') || undefined,
      targetType: url.searchParams.get('targetType') || undefined,
    }) });
  } catch (error) {
    return handleApiError(error);
  }
};
