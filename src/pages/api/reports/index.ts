// src/pages/api/reports/index.ts

export const prerender = false;

import type { APIRoute } from 'astro';
import { handleApiError } from '../../../lib/errors';
import { json } from '../../../lib/dashboard/server';
import {
  createReportFromRequest,
  getReportDashboardData,
} from '../../../server/services/report.service';

export const GET: APIRoute = async ({ url }) => {
  try {
    const data = await getReportDashboardData(url);
    return json({ success: true, data });
  } catch (error) {
    return handleApiError(error);
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const report = await createReportFromRequest(await request.json(), locals.user?.id);
    return json({
      success: true,
      data: report,
      message: 'รายงานสำเร็จ ขอบคุณสำหรับการแจ้งเตือน',
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
};
