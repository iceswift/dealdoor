// src/pages/api/reports/[id]/action.ts

export const prerender = false;

import type { APIRoute } from 'astro';
import { forbidden, handleApiError, unauthorized } from '../../../../lib/errors';
import { json } from '../../../../lib/dashboard/server';
import { moderateReport } from '../../../../server/services/report.service';

export const POST: APIRoute = async ({ params, request, locals }) => {
  try {
    if (!locals.user) {
      throw unauthorized();
    }
    if (locals.user.role !== 'admin') {
      throw forbidden('ต้องเป็นผู้ดูแลระบบเพื่อจัดการรายงาน');
    }

    await moderateReport(params.id!, await request.json(), locals.user.id);
    return json({ success: true, message: 'ดำเนินการสำเร็จ' });
  } catch (error) {
    return handleApiError(error);
  }
};
