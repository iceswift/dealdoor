// src/pages/api/reports/index.ts

export const prerender = false;

import type { APIRoute } from 'astro';
import { forbidden, handleApiError, unauthorized } from '../../../lib/errors';
import { json } from '../../../lib/dashboard/server';
import {
  createReportFromRequest,
  getReportDashboardData,
} from '../../../server/services/report.service';

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    if (!locals.user) {
      throw unauthorized();
    }
    if (locals.user.role !== 'admin') {
      throw forbidden('ต้องเป็นผู้ดูแลระบบเพื่อดูรายงาน');
    }
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
