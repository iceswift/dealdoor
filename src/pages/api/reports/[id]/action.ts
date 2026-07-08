// src/pages/api/reports/[id]/action.ts

export const prerender = false;

import type { APIRoute } from 'astro';
import { badRequest, handleApiError } from '../../../../lib/errors';
import { json } from '../../../../lib/dashboard/server';
import { moderateReport } from '../../../../server/services/report.service';

export const POST: APIRoute = async ({ params, request, locals }) => {
  try {
    if (!locals.user) {
      throw badRequest('UNAUTHORIZED', 'กรุณาเข้าสู่ระบบ');
    }

    await moderateReport(params.id!, await request.json(), locals.user.id);
    return json({ success: true, message: 'ดำเนินการสำเร็จ' });
  } catch (error) {
    return handleApiError(error);
  }
};
